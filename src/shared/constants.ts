import { glMatrix } from 'gl-matrix';

// Запас травы за границей застройки, метры
export const GROUND_MARGIN = 100;
// Порог движения указателя (px): дальше - жест считается перетаскиванием (пан/орбита камеры), а не кликом.
export const CLICK_MOVE_THRESHOLD = 6;
export const EPSILON = glMatrix.EPSILON;
// Порог прилипания (px): ближе порога точка прилипнет к углу здания
export const SNAP_PIXEL_THRESHOLD = 12;
