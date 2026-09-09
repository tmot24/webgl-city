import { vec3 } from 'gl-matrix';
import { EPSILON } from '../constants';

interface IntersectGround {
  // начало луча (позиция камеры)
  origin: vec3;
  // направление луча (нормализованное)
  dir: vec3;
}

// Пересечение луча с землёй - плоскость y=0. null - луч параллелен земле или уходит вверх
export function intersectGround({ origin, dir }: IntersectGround) {
  if (Math.abs(dir[1]) < EPSILON) return null; // параллелен земле
  const t = -origin[1] / dir[1];
  if (t < 0) return null; // земля позади камеры
  return vec3.scaleAndAdd(vec3.create(), origin, dir, t);
}
