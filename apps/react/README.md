# WebGL2 City · React

React-версия WebGL2 City: React 19 и MobX 7.
Вся логика сцены — в [ядре](../../packages/core), приложение связывает его с MobX и жизненным циклом React.

**Демо:** https://tmot24.github.io/webgl-city/react/

**Стек:** React 19, MobX 7 + `mobx-react-lite`, Vite 8, ESLint (`react-hooks`), WebGL2 через `@webgl-city/core`, общие стили `@webgl-city/styles`.

---

## Главная идея: React рисует UI, MobX рисует кадры

Камера, размер canvas и состояние сцены — MobX-объекты. Рендер подписан на них через `reaction`, поэтому вращение камеры перерисовывает canvas, но не вызывает ни одного ре-рендера React-компонента. React участвует только тогда, когда меняется интерфейс: панели, переключатель режимов.

```
mousemove → camera.rotate (action) → computed → reaction → rAF → renderer.render
```

Если бы камера жила в `useState`, `Scene` со всем деревом перерисовывалась бы на каждое движение мыши.

---

## Как устроено

Приложение — набор хуков над функциями ядра. Каждый хук подключает ресурс ядра к жизненному циклу React: функция очистки из ядра сразу становится cleanup эффекта.

| Хук | Над чем из ядра | Что делает |
| --- | --- | --- |
| `useViewportCanvas` | `observeCanvasSize` | подключает canvas к viewport: ссылка и размер буфера |
| `useOrbitControls` | `bindOrbitControls` | ввод мыши → действия камеры |
| `useCityRender` | `createCityRenderer` | кадр из MobX → рендер через `reaction` |
| `useCanvasPointer` | `bindCanvasPointer` | клик и движение → луч, с флагом режима |
| `useBuildingPicker` | `nearestBuildingHit` | выбор здания → `BuildingStore` |
| `useMeasure` | `createMeasurePicker` | точки измерения и прилипание → `MeasureStore` |
| `useRoute` | `createRoutePlanner` | точки A/B и путь A* → `RouteStore` |
| `useScreenOverlay` | `applyScreenOverlay` | метка поверх сцены без ре-рендеров |
| `useEscapeKey` | — | Esc → сброс действия активного режима |

Хуки фич вызываются в `Scene` и получают зависимости параметрами: `useRoute({ cityScene, viewport, store })`. Контекст в React течёт только вниз, и компонент не может прочитать то, что сам провайдит. Поэтому контексты раздают сторы и viewport дочерним компонентам: панелям и меткам.

---

## Состояние

Классы с `makeAutoObservable`, собранные по паттерну RootStore:

| Стор | Что хранит |
| --- | --- |
| `SceneModeStore` | активный режим и флаги `isBuilding` / `isMeasure` / `isRoute` |
| `BuildingStore` | выбранное здание |
| `MeasureStore` | измерения, незавершённый отрезок, точка прилипания |
| `RouteStore` | точки A/B и найденный путь |
| `SceneStore` | корень: создаёт сторы фич, свет, `selectedId`, `activePolyline`, `cancelActiveAction` |
| `OrbitCamera`, `SceneViewport` | камера, размер canvas, матрица вида-проекции, проектор мир → экран |

- **Скоуп сцены.** Сторы создаются в `Scene` через `useState(() => new SceneStore())`: один экземпляр на сцену, уходит вместе с ней. Раздаются через React Context, `useSceneStore()` без провайдера даёт понятную ошибку.
- **Флаги режима — отдельные геттеры.** `boolean` — примитив, поэтому `computed` оповещает только при реальной смене флага. Геттер, возвращающий объект флагов, будил бы всех читателей при любой смене режима.
- **`observableRef` и `observableShallow` вместо глубоких observable.** Камера, выбранное здание и путь — неизменяемые значения, их заменяют целиком: хранится ссылка, без Proxy-копии. Массив измерений — `observableShallow`: `push` и `splice` видны, элементы лежат как есть.
- **Служебное — вне реактивности.** Счётчик id измерений помечен `false` и не отслеживается.
- **Локальное — в `useState`.** Счётчик FPS не трогает MobX: состояние нужно одному компоненту.

---

## Рендер

```ts
useLayoutEffect(() => {
  const renderer = createCityRenderer({ canvas, instanceData, ground, road });

  const dispose = reaction(
    (): CityFrame => ({ size: viewport.size, camera: { /* ... */ }, light: { /* ... */ }, selectedId: store.selectedId, polyline: store.activePolyline }),
    (frame) => renderer.render(frame),
    { fireImmediately: true, scheduler: (run) => requestAnimationFrame(run) },
  );

  return () => {
    dispose();
    renderer.dispose();
  };
}, [canvasRef, cityScene, viewport, store]);
```

- **`reaction`**: первая функция — что отслеживать (сборка кадра), вторая — что делать (отрисовка).
- **`scheduler: requestAnimationFrame`.** Все изменения до кадра браузера склеиваются: и сборка кадра, и отрисовка не чаще раза за кадр. Встроенная проверка `isDisposed` не даёт отрисовать кадр после размонтирования.
- **`useLayoutEffect`.** Первый кадр рисуется до того, как браузер покажет страницу, без белой вспышки.

---

## Решения и оптимизации

- **Метки поверх сцены без ре-рендеров.** Подпись длины и маркер прилипания рендерятся React один раз. Позицию, текст и видимость пишет `reaction` прямо в элемент: с rAF-планировщиком и сравнением по содержимому (`equals`), так что одинаковые данные не трогают DOM. Компоненты меток даже не обёрнуты в `observer`: при рендере они ничего не читают.
- **Позиция через CSS-переменные.** `--anchor-x` / `--anchor-y` (зарегистрированы через `@property`) и `transform`, без пересчёта раскладки.
- **`observer` на каждом компоненте, читающем стор, и только на нём.** Переключение панелей по режиму вынесено в отдельный `ModePanels`, чтобы смена режима не перерисовывала всю `Scene`. `Scene` не `observer`: она создаёт и раздаёт сторы, но ничего из них не читает.
- **`useEffectEvent` для колбэков.** Указатель и Esc всегда видят свежие колбэки, но слушатели не перевешиваются на каждом рендере.
- **`useState` против `useMemo`.** Сторы — состояние, их нельзя потерять: `useState`. Граф дорог и пикер измерений — производные данные города: `useMemo`.
- **Сравнение по значению, а не по ссылке.** `setSize` игнорирует новый объект с тем же размером, `segment` отдаёт само выбранное измерение, переходы камеры сохраняют ссылку на центр.
- **StrictMode включён.** Двойное монтирование в dev проверяет, что каждый ресурс правильно освобождается: GL, подписки, слушатели.

---

## Структура

```
src/
  app/           оболочка, сцена (Scene, ModePanels), подсказка управления, счётчик FPS
  camera/        OrbitCamera, useOrbitControls
  render/        SceneViewport, useViewportCanvas, useCityRender, useScreenOverlay
  interaction/   useCanvasPointer, useEscapeKey
  store/         корневой SceneStore и контекст
  shared/        createRequiredContext
  features/
    mode/            режим сцены: стор, переключатель, подсказка
    building-pick/   выбор здания: стор, хук, панель
    measure/         измерения: стор, хук, лог, подпись, маркер прилипания
    route/           маршрут: стор, хук, панель
```

---

## Запуск

Из корня репозитория:

```bash
npm install
npm run start:react   # dev-сервер Vite
npm run build:react   # проверка типов + prod-сборка
npm run lint:react    # ESLint
```

---

Та же сцена на Angular — [apps/angular](../angular). Ядро — [packages/core](../../packages/core).
