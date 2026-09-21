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
  dirNorm: vec3;
  // прямоугольник земли: точка вне него => null
  bounds: GroundBounds;
}

export interface GroundHit {
  point: vec3;
  // расстояние вдоль луча (dirNorm нормализован => в метрах)
  distance: number;
}

// Пересечение луча с землёй - плоскость y=0. null - луч параллелен земле, уходит вверх или попадает за край травы
export function intersectGround({ origin, dirNorm, bounds }: IntersectGround): GroundHit | null {
  if (Math.abs(dirNorm[1]) < EPSILON) return null; // параллелен земле
  const distance = -origin[1] / dirNorm[1]; // уравнение: origin.y + dir.y * distance = 0
  if (distance < 0) return null; // земля позади камеры

  // точка пересечения
  const point = vec3.scaleAndAdd(vec3.create(), origin, dirNorm, distance); // уравнение: origin + dir * distance
  if (point[0] < bounds.minX || point[0] > bounds.maxX || point[2] < bounds.minZ || point[2] > bounds.maxZ) {
    return null; // за краем травы
  }
  return { point, distance };
}
