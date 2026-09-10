import { glMatrix } from 'gl-matrix';

// Порог движения указателя (px): дальше - жест считается перетаскиванием (пан/орбита камеры), а не кликом.
export const CLICK_MOVE_THRESHOLD = 6;
export const EPSILON = glMatrix.EPSILON;
