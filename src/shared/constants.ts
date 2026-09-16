import { glMatrix, vec3 } from 'gl-matrix';

// Запас травы за границей застройки, метры
export const GROUND_MARGIN = 100;
// Порог движения указателя (px): дальше - жест считается перетаскиванием (пан/орбита камеры), а не кликом.
export const CLICK_MOVE_THRESHOLD = 6;
export const EPSILON = glMatrix.EPSILON;
// Порог прилипания (px): ближе порога точка прилипнет к углу здания
export const SNAP_PIXEL_THRESHOLD = 12;

export const LINE_COLOR = vec3.fromValues(1.0, 0.75, 0.1);
// Полутолщина = factor * расстояние до камеры => на экране толщина почти постоянна на любом зуме
export const LINE_HALF_WIDTH_FACTOR = 0.001;
export const FLOATS_PER_SEGMENT = 18; // 6 вершин (2 прямоугольника) * 3 float
