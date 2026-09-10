import { vec3 } from 'gl-matrix';
import { EPSILON } from '../constants';

export interface GroundBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface IntersectGround {
  // начало луча (позиция камеры)
  origin: vec3;
  // направление луча (нормализованное)
  dir: vec3;
  // прямоугольник земли: точка вне него => null
  bounds: GroundBounds;
}

// Пересечение луча с землёй - плоскость y=0. null - луч параллелен земле или уходит вверх
export function intersectGround({ origin, dir, bounds }: IntersectGround) {
  if (Math.abs(dir[1]) < EPSILON) return null; // параллелен земле
  const t = -origin[1] / dir[1];
  if (t < 0) return null; // земля позади камеры

  const point = vec3.scaleAndAdd(vec3.create(), origin, dir, t);
  if (point[0] < bounds.minX || point[0] > bounds.maxX || point[2] < bounds.minZ || point[2] > bounds.maxZ) {
    return null; // за краем траввы
  }
  return point;
}
