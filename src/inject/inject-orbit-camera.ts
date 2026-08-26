import { afterNextRender, computed, DestroyRef, ElementRef, inject, signal, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';

interface InjectOrbitCamera {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  // Положение наблюдателя
  initialEye: vec3;
  // Куда смотрит камера
  center?: vec3;
  // Верх смотрящего
  up?: vec3;
  // Чувствительность: радиан поворота на пиксель мыши
  rotateSpeed?: number;
  // Нижний предел наклона (не доходим до верхгнего полюса)
  minPolar?: number;
  // Верхний предел наклона (не доходим до нижнего плюса)
  maxPolar?: number;
  // Чувствительность зума: множитель на прокрутку колеса (через exp(deltaY * zoomSpeed))
  zoomSpeed?: number;
  // Пределы радиуса (как близко/далеко можно подлететь), метры
  minRadius?: number;
  maxRadius?: number;
}

/**
 * Радиус — насколько камера далеко от центра (размер глобуса). Меняется колесом (зум).
 * Азимут — угол «по экватору», вокруг вертикальной оси Y. Это вращение влево-вправо.
 *  Полный круг = облёт вокруг объекта. Его-то мы и освобождаем на 360°.
 * Полярный угол — угол «от северного полюса вниз». 0 = смотрим сверху, π/2 (90°) = смотрим сбоку с экватора, π = снизу.
 *  Это наклон вверх-вниз. Его ограничиваем, чтобы не перелететь через полюс (там камера переворачивается).
 * */

export function injectOrbitCamera({
  canvasRef,
  initialEye,
  center = vec3.fromValues(0.0, 0.0, 0.0),
  up = vec3.fromValues(0.0, 1.0, 0.0),
  rotateSpeed = 0.01, // ~0.57° на пиксель — комфортно
  minPolar = 0.1, // чуть больше 0: не упираемся в верхний полюс
  maxPolar = Math.PI / 2 - 0.1, // чуть меньше π/2
  zoomSpeed = 0.001, // изменение колеса (delta ~100) = 10% радиуса
  minRadius = 80, // ближе - уже среди зданий
  maxRadius = 4500, // дальше держим в пределах far (6000) камеры сцены
}: InjectOrbitCamera) {
  const destroyRef = inject(DestroyRef);

  /**
   * Начальные углы вычисляем ОДИН раз из стартовой позиции камеры
   * Радиус = расстояние от центра до камеры (длина вектора initialEye)
   * */
  const initialRadius = vec3.length(initialEye);
  const radius = signal(initialRadius);
  /**
   * Раскладываем стартовую позицию обратно в углы (обратный перевод из x/y/z в сферические)
   * polar (наклон) - угол между осью Y и вектором камеры.
   * acos(y / radius): если камера высоко (y≈radius) → polar≈0 (сверху);
   * если на экваторе (y≈0) → polar≈90°.
   * */
  const initialPolar = Math.acos(initialEye[1] / initialRadius);
  /**
   * azimuth (поворот вокруг Y, по экватору) - atan2 берёт угол из пары (x, z)
   *  atan2 сам разбирается со знаками и даёт правильный угол во всех четвертях.
   * */
  const initialAzimuth = Math.atan2(initialEye[0], initialEye[2]);
  // Свободный, без ограничений → полный оборот 360°
  const azimuth = signal(initialAzimuth);
  // Ограничен пределами, чтобы не перевернуться
  const polar = signal(initialPolar);
  /**
   * Позиция камеры = перевод (radius, polar, azimuth) обратно в x/y/z.
   * Это сферические координаты. Разбор по осям:
   * */
  const eyePoint = computed(() => {
    const r = radius();
    const p = polar();
    const a = azimuth();
    // sin(polar) - "насколько далеко от вертикальной оси" (радиус горизонтального круга на этой высоте).
    // На полюсе (polar=0) sin=0 → камера строго над центром; на экваторе sin=1 → максимально сбоку.
    const horizontal = r * Math.sin(p);
    return vec3.fromValues(
      horizontal * Math.sin(a), // x: горизонтальный радиус * sin(азимут)
      r * Math.cos(p), // y: высота - только от наклона (cos: 1 сверху, 0 на экваторе, -1 снизу)
      horizontal * Math.cos(a), // z: горизонтальный радиус * cos(азимут)
    );
  });

  /**
   * Матрица вида - тоже производная: lookAt из позиции камеры в центр.
   * computed → пересчитывается сам, когда меняются углы.
   * */
  const viewMatrix = computed(() => mat4.lookAt(mat4.create(), eyePoint(), center, up));

  const mouseMoveHandler = (event: MouseEvent) => {
    // Вращаем только при зажатой ПКМ (бит 2 в маске buttons)
    if ((event.buttons & 2) !== 2) return;

    // movementX/Y - это СМЕЩЕНИЕ мыши с прошлого события (дельта), а не позиция.
    // Именно дельта позволяет крутить бесконечно: тянешь дальше - угол растёт без предела.
    const deltaAzimuth = event.movementX * rotateSpeed;
    const deltaPolar = event.movementY * rotateSpeed;

    // Азимут просто накапливаем предел не нужен, 360° и дальше по кругу.
    // Знак минус: тянешь мышл вправо → сцена поворачивается влево (привычно для orbit).
    azimuth.update((a) => a - deltaAzimuth);

    // Полярный угол накапливаем, но зажимаем в [minPolar, maxPolar],
    // чтобы камера не перелетела через полюс и не перевернулась. Тоже минус.
    polar.update((p) => Math.min(maxPolar, Math.max(minPolar, p - deltaPolar)));
  };

  const contextMenuHandler = (event: MouseEvent) => {
    event.preventDefault(); // гасим системное меню по ПКМ
  };

  const wheelHandler = (event: WheelEvent) => {
    event.preventDefault();

    // Мультипликативный зум: exp даёт плавный постоянный шаг в процентах, а не в метрах.
    // deltaY > 0 (крутим "от себя") => factor > 1 => радиус растёт (отдаляемся)
    // deltaY < 0 (крутим "на себя") => factor < 1 => приближаемся
    const factor = Math.exp(event.deltaY * zoomSpeed);
    radius.update((r) => Math.min(maxRadius, Math.max(minRadius, r * factor)));
  };

  // Один раз. Слушатели вешаем только после того, как view гарантированно инициализирован
  // и canvasRef() можно безопасно резолвить
  afterNextRender({
    write: () => {
      const canvasElement = canvasRef().nativeElement;
      canvasElement.addEventListener('mousemove', mouseMoveHandler);
      canvasElement.addEventListener('contextmenu', contextMenuHandler);
      // passive: false - обязательно, иначе preventDefault на wheel игнорируется, и страница скролиться
      canvasElement.addEventListener('wheel', wheelHandler, { passive: false });

      destroyRef.onDestroy(() => {
        canvasElement.removeEventListener('mousemove', mouseMoveHandler);
        canvasElement.removeEventListener('contextmenu', contextMenuHandler);
        canvasElement.removeEventListener('wheel', wheelHandler);
      });
    },
  });

  return {
    viewMatrix,
    eyePoint,
  };
}
