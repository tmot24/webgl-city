import { vec3 } from 'gl-matrix';

// Параметры сцены города, общие для всех приложений

export const CITY_CAMERA = {
  // Камера под масштаб города (~1450 м): initialEye задаёт радиус (~2780 м) и 3/4-ракурс сверху
  initialEye: vec3.fromValues(1500, 1800, 1500),
  // near/far: ближайшее здание дальше ~1700 м, поэтому near можно поднять - меньше z-fighting
  near: 10,
  far: 10000,
};

export const CITY_COLORS = {
  ground: vec3.fromValues(0.36, 0.55, 0.32),
  road: vec3.fromValues(0.25, 0.25, 0.27),
};

// Солнце сверху-сбоку: направление НА свет, нормализованное
export const DEFAULT_LIGHT_DIRECTION = vec3.normalize(vec3.create(), vec3.fromValues(0.6, 1.0, 0.4));
