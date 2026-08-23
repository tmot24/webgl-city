import { glMatrix, vec3 } from 'gl-matrix';

interface RayIntersectsTriangle {
  // Начало луча (в том же пространстве, что и вершины)
  origin: vec3;
  // Направление луча (нормализованное)
  dir: vec3;
  // Вершины треугольника
  v0: vec3;
  v1: vec3;
  v2: vec3;
}

/**
 * Пересечение луча с треугольником по алгоритму Мёллера–Трумбора (Möller–Trumbore).
 *
 * Возвращает t — расстояние вдоль луча до точки попадания (origin + t*dir),
 * либо null, если луч проходит мимо треугольника или позади камеры.
 *
 * t нужен, чтобы среди нескольких задетых треугольников выбрать БЛИЖАЙШИЙ
 * (наименьший положительный t) — это грань, обращённая к камере.
 */
export function rayIntersectsTriangle({ origin, dir, v0, v1, v2 }: RayIntersectsTriangle) {
  // EPSILON - порог, ниже которого считаем число нулём
  const EPSILON = glMatrix.EPSILON;

  // два ребра треугольника от вершины v0
  const edge1 = vec3.subtract(vec3.create(), v1, v0);
  const edge2 = vec3.subtract(vec3.create(), v2, v0);

  // если луч параллелен плоскости треугольника - определитель близок к нулю => мимо
  const pvec = vec3.cross(vec3.create(), dir, edge2);
  const det = vec3.dot(edge1, pvec);
  if (Math.abs(det) < EPSILON) {
    return null;
  }

  const invDet = 1.0 / det;

  // барицентрическая координата u: должна быть в [0, 1], иначе точка вне треугольника
  const tvec = vec3.subtract(vec3.create(), origin, v0);
  const u = vec3.dot(tvec, pvec) * invDet;
  if (u < 0 || u > 1) {
    return null;
  }

  // барицентрическая координата v: u + v тоже должно быть <= 1
  const qvec = vec3.cross(vec3.create(), tvec, edge1);
  const v = vec3.dot(dir, qvec) * invDet;
  if (v < 0 || u + v > 1) {
    return null;
  }

  // t - расстояние до пересечения; отрицательное = треугольник позади камеры
  const t = vec3.dot(edge2, qvec) * invDet;
  return t > EPSILON ? t : null;
}
