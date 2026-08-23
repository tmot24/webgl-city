import { glMatrix, vec3 } from 'gl-matrix';

interface RayIntersectsBox {
  origin: vec3;
  dir: vec3;
  boxMin: vec3;
  boxMax: vec3;
}

/**
 * Пересечение луча с осевой коробкой (метод слэбов)
 * */
export function rayIntersectsBox({ origin, dir, boxMin, boxMax }: RayIntersectsBox) {
  let tMin = -Infinity; // самый поздний "вход" в полосу
  let tMax = Infinity; // самый ранний "выход" из полосы

  for (let axis = 0; axis < 3; axis++) {
    const o = origin[axis];
    const d = dir[axis];

    // glMatrix.EPSILON - порог, ниже которого считаем число нулём
    if (Math.abs(d) < glMatrix.EPSILON) {
      // луч параллелен плоскостям этой оси: начало вне полосы => промах
      if (o < boxMin[axis] || o > boxMax[axis]) return false;
    } else {
      let t1 = (boxMin[axis] - o) / d;
      let t2 = (boxMax[axis] - o) / d;
      if (t1 > t2) {
        [t1, t2] = [t2, t1]; // t1 — вход, t2 — выход
      }

      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);

      if (tMin > tMax) return false; // полосы не пересеклись → мимо
    }
  }

  return tMax >= 0; // коробка перед камерой
}
