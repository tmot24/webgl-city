import { glMatrix, vec3 } from 'gl-matrix';

interface RayBoxDistance {
  // Начало луча
  origin: vec3;
  // Направление луча (нормализованное). Точка на луче = origin + t * dir
  dir: vec3;
  // Ближний-нижний-левый угол коробки: покомпонентный минимум [minX, minY, minZ]
  boxMin: vec3;
  // Дальний-верхний-правый угол коробки: покомпонентный максимум [maxX, maxY, maxZ]
  boxMax: vec3;
}

/**
 * Пересечение луча с осевой коробкой методом слэбов, возвращает РАССТОЯНИЕ до входа
 * (tMin) вдоль луча. Нужно, чтобы среди задетых коробок выбрать БЛИЖАЙШУЮ.
 * */
export function rayBoxDistance({ origin, dir, boxMin, boxMax }: RayBoxDistance) {
  let tMin = -Infinity;
  let tMax = Infinity;

  for (let axis = 0; axis < 3; axis++) {
    const o = origin[axis];
    const d = dir[axis];

    if (Math.abs(d) < glMatrix.EPSILON) {
      // луч параллелен плоскостям оси: начало вне полосы => мимо
      if (o < boxMin[axis] || o > boxMax[axis]) return null;
    } else {
      let t1 = (boxMin[axis] - o) / d;
      let t2 = (boxMax[axis] - o) / d;
      if (t1 > t2) {
        [t1, t2] = [t2, t1];
      }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }
  }

  if (tMax < 0) return null; // коробка целиком позади камеры
  return tMin >= 0 ? tMin : tMax; // вход; если камера внутри коробки - выход
}
