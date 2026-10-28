# WebGL2 City · Angular

Angular-версия WebGL2 City: zoneless, сигналы и сторы на `@ngrx/signals`.
Вся логика сцены — в [ядре](../../packages/core), приложение связывает его с реактивностью и жизненным циклом Angular.

**Демо:** https://tmot24.github.io/webgl-city/angular/

**Стек:** Angular 22 (standalone, zoneless, `OnPush`), сигналы, `@ngrx/signals` (`signalStore`), WebGL2 через `@webgl-city/core`, общие стили `@webgl-city/styles`.

---

## Как устроено

Приложение — набор тонких адаптеров `inject*` над функциями ядра. Каждый адаптер делает три вещи: берёт зависимости через DI, держит состояние в сигналах и подключает ресурс ядра к жизненному циклу (`afterNextRender` + `DestroyRef`).

| Адаптер | Над чем из ядра | Что даёт |
| --- | --- | --- |
| `injectCanvasSize` | `observeCanvasSize` | размер буфера рисования как сигнал |
| `injectOrbitCamera` | `orbit`, `bindOrbitControls` | состояние камеры в сигнале, производные через `computed` |
| `injectCityRender` | `createCityRenderer` | кадр из сигналов → рендер |
| `injectCanvasPointer` | `bindCanvasPointer` | клик и движение → луч, с флагом режима |
| `injectBuildingPicker` | `nearestBuildingHit` | выбор здания → `BuildingStore` |
| `injectMeasure` | `createMeasurePicker` | точки измерения и прилипание → `MeasureStore` |
| `injectRoute` | `createRoutePlanner` | точки A/B и путь A* → `RouteStore` |
| `injectScreenOverlay` | `applyScreenOverlay` | метка поверх сцены без change detection |

Фичи вызываются без аргументов: `injectRoute()`, `injectMeasure()`, `injectBuildingPicker()`. Зависимости приходят из DI:
- **`CITY_SCENE`** — токен с данными города, провайдится в `Scene`: город строится один раз на экземпляр сцены;
- **`SceneViewport`** — камера и canvas для фич (лучи, проекция мир → экран). Подключает его `injectCityRender`, потому что именно он создаёт камеру.

---

## Состояние

Сторы на `@ngrx/signals`, по одному на фичу:

| Стор | Что хранит |
| --- | --- |
| `SceneModeStore` | активный режим и флаги `is.building` / `is.measure` / `is.route` |
| `BuildingStore` | выбранное здание |
| `MeasureStore` | измерения, незавершённый отрезок, точка прилипания |
| `RouteStore` | точки A/B и найденный путь |
| `SceneStore` | своего состояния нет: линия для рендера и сброс действия по Esc |

- **Скоуп сцены, а не `root`.** Все сторы зарегистрированы в `providers` компонента `Scene`: один экземпляр на сцену, уничтожается вместе с ней, `inject()` вне дерева сцены даёт ошибку.
- **Изменение только методами стора** (`protectedState` по умолчанию): снаружи состояние только читается.
- **Тяжёлые вычисления вне стора.** Пересечения и поиск пути делают адаптеры с помощью ядра, в стор попадает только результат.
- **Межсторовая логика — в `SceneStore`:** `activePolyline` (что рисовать линией в текущем режиме) и `cancelActiveAction` (Esc).

Поток данных однонаправленный:

```
клик по canvas → inject* (луч, пересечения, A*) → метод стора → сигналы → компоненты UI и рендер
```

---

## Рендер

`injectCityRender` собирает кадр как данные и отдаёт его рендеру ядра:

```ts
const frame = computed((): CityFrame => ({
  size: size(),
  camera: { viewProjection: viewProjection(), eye: eyePoint(), center: center(), distance: distance() },
  light: { directionNorm: lightDirectionNorm(), castShadows: castShadows() },
  selectedId: isHighlightBuild() ? (selectedBuilding()?.id ?? -1) : -1,
  polyline: activePolyline(),
}));

afterRenderEffect({
  write: () => {
    const current = frame(); // сначала подписка, потом проверка
    renderer?.render(current);
  },
});
```

- **`afterRenderEffect({ write })`** выполняется в фазе записи цикла отрисовки Angular: несколько изменений сигналов до кадра дают одну отрисовку.
- **Порядок чтения важен.** Сигнал читается до любого раннего выхода. Иначе эффект при первом запуске остался бы без зависимостей и больше не сработал.
- **Перерисовка только по изменению**, без постоянного цикла `requestAnimationFrame`.

---

## Решения и оптимизации

- **Метки поверх сцены без change detection.** Подпись длины и маркер прилипания — host-элементы компонентов с пустым шаблоном. `computed(read, { equal })` отсекает одинаковые данные, `afterRenderEffect({ write })` пишет позицию и текст прямо в DOM. При вращении камеры шаблоны не проверяются.
- **Позиция через CSS-переменные.** Метки получают точку в `--anchor-x` / `--anchor-y` (зарегистрированы через `@property`, без наследования), сдвиг делает `transform`, без пересчёта раскладки.
- **Сравнение по значению, а не по ссылке.** Сигнал размера canvas с `equal` по ширине и высоте не будит подписчиков одинаковым размером. `segment` в `MeasureStore` отдаёт само выбранное измерение, а не новый объект.
- **Стабильные ссылки в камере.** Переходы ядра при повороте и зуме сохраняют ссылку на центр орбиты, поэтому `computed` центра не оповещает подписчиков, пока центр не сдвинулся.
- **Проверено профилировщиком.** В prod-сборке на JS при вращении камеры уходит около 4 мс за 4,5 секунды, кадры стабильно 60 FPS. В dev-режиме с открытыми DevTools заметна цена dev-проверок Angular на каждый tick (`checkNoChanges`).
- **Куда расти.** Сейчас каждое движение камеры проходит через tick приложения: идиоматично и в prod незаметно. Если UI вырастет, горячий путь «камера → кадр» можно вывести из Angular (RxJS с `animationFrameScheduler` или внешний стор, для UI — мост через `toSignal`), не трогая ядро.

---

## Структура

```
src/
  app/           оболочка, сцена (Scene + CITY_SCENE), подсказка управления, счётчик FPS
  camera/        injectOrbitCamera
  render/        injectCanvasSize, injectCityRender, injectScreenOverlay, SceneViewport
  interaction/   injectCanvasPointer
  store/         корневой SceneStore
  features/
    mode/            режим сцены: стор, переключатель, подсказка
    building-pick/   выбор здания: стор, адаптер, панель
    measure/         измерения: стор, адаптер, лог, подпись, маркер прилипания
    route/           маршрут: стор, адаптер, панель
```

---

## Запуск

Из корня репозитория:

```bash
npm install
npm run start:angular   # dev-сервер
npm run build:angular   # prod-сборка
```

---

Та же сцена на React + MobX — [apps/react](../react). Ядро — [packages/core](../../packages/core).
