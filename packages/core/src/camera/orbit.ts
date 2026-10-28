import { mat4, vec3 } from 'gl-matrix';
import { OrbitDelta, OrbitSettings, OrbitState } from './orbit.type';

export const DEFAULT_ORBIT_SETTINGS: OrbitSettings = {
  rotateSpeed: 0.01, // ~0.57° на пиксель — комфортно
  minPolar: 0.1, // чуть больше 0: не упираемся в верхний полюс
  maxPolar: Math.PI / 2 - 0.1, // чуть меньше π/2
  zoomSpeed: 0.001, // изменение колеса (delta ~100) = 10% радиуса
  minRadius: 80, // ближе - уже среди зданий
  maxRadius: 4500, // дальше держим в пределах far камеры сцены
  panSpeed: 0.0007, // ~1:1 "захват" земли при обзоре ~800px / FOV 30
};

// Зажимает значение в диапазон [min, max]: ниже min → min, выше max → max
const clamp = ({ value, min, max }: { value: number; min: number; max: number }) => {
  return Math.min(max, Math.max(min, value));
};

/**
 * Стартовое состояние из позиции камеры: обратный перевод x/y/z => сферические координаты.
 * Считаем от смещения eye - center, поэтому центр орбиты может быть где угодно.
 * */
export function createOrbitState({ eye, center = vec3.create() }: { eye: vec3; center?: vec3 }): OrbitState {
  const offset = vec3.subtract(vec3.create(), eye, center);
  // Радиус = расстояние от центра до камеры
  const radius = vec3.length(offset);
  return {
    // Копируем, чтобы не мутировать аргумент
    center: vec3.clone(center),
    radius,
    // acos(y / radius): камера высоко (y≈radius) → polar≈0 (сверху); на экваторе (y≈0) → polar≈90°
    polar: Math.acos(offset[1] / radius),
    // atan2 сам разбирается со знаками и даёт правильный угол во всех четвертях
    azimuth: Math.atan2(offset[0], offset[2]),
  };
}

/**
 * Позиция камеры = центр + сферическое смещение (radius, polar, azimuth).
 * При пане камера едет вместе с точкой, вокруг которой вращается.
 */
export function orbitEye({ state }: { state: OrbitState }): vec3 {
  const { center, radius, polar, azimuth } = state;
  // sin(polar) - радиус горизонтального круга на этой высоте:
  // на полюсе (polar=0) sin=0 → камера строго над центром; на экваторе sin=1 → максимально сбоку
  const horizontal = radius * Math.sin(polar);
  const offset = vec3.fromValues(
    horizontal * Math.sin(azimuth), // x: горизонтальный радиус * sin(азимут)
    radius * Math.cos(polar), // y: высота - только от наклона
    horizontal * Math.cos(azimuth), // z: горизонтальный радиус * cos(азимут)
  );

  return vec3.add(vec3.create(), center, offset);
}

// Матрица вида: lookAt из позиции камеры в центр орбиты
export function orbitViewMatrix({ state, up = vec3.fromValues(0, 1, 0) }: { state: OrbitState; up?: vec3 }): mat4 {
  return mat4.lookAt(mat4.create(), orbitEye({ state }), state.center, up);
}

export function panOrbit({ state, dx, dy, settings }: OrbitDelta): OrbitState {
  const a = state.azimuth;
  // Оси экрана, спроецированные на землю (из азимута)
  // "вправо по экрану"
  const rightGround = {
    x: Math.cos(a),
    z: -Math.sin(a),
  };
  // "в глубину экрана"
  const forwardGround = {
    x: -Math.sin(a),
    z: -Math.cos(a),
  };
  const scale = state.radius * settings.panSpeed;

  // Тянешь мышь вправо => землю вправо => центр влево (обратный знак), аналогично вниз
  const moveX = (-rightGround.x * dx + forwardGround.x * dy) * scale;
  const moveZ = (-rightGround.z * dx + forwardGround.z * dy) * scale;

  const [x, y, z] = state.center;
  return {
    ...state,
    center: vec3.fromValues(x + moveX, y, z + moveZ),
  };
}

/**
 * Вращение вокруг центра. Дельта (а не позиция) позволяют крутить бесконечно.
 * Знак минус: тянешь мышь вправо => сцена поворачивается влево (привычно для orbit).
 * Полярный угол зажимаем, чтобы камера не пролетела через полюс.
 * */
export function rotateOrbit({ state, dx, dy, settings }: OrbitDelta): OrbitState {
  return {
    ...state,
    azimuth: state.azimuth - dx * settings.rotateSpeed,
    polar: clamp({
      value: state.polar - dy * settings.rotateSpeed,
      min: settings.minPolar,
      max: settings.maxPolar,
    }),
  };
}

/**
 * Мультипликативный зум: exp даёт постоянный шаг в процентах, а не в метрах.
 * deltaY > 0 (крутим "от себя") => factor > 1 => отдаляемся.
 * */
export function zoomOrbit({
  state,
  deltaY,
  settings,
}: {
  state: OrbitState;
  deltaY: number;
  settings: OrbitSettings;
}): OrbitState {
  const factor = Math.exp(deltaY * settings.zoomSpeed);
  return {
    ...state,
    radius: clamp({
      value: state.radius * factor,
      min: settings.minRadius,
      max: settings.maxRadius,
    }),
  };
}

/**
 * rotateOrbit и zoomOrbit возвращают тот же объект center (через ...state).
 * Это важно для реактивности: computed(() => state().center) в Angular не сработает при повороте, потому что ссылка не изменилась.
 * Значит, всё, что зависит только от центра, не будет пересчитываться при вращении. С computed в MobX то же самое.
 * */
