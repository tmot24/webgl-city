import { mat4, vec3, vec4 } from 'gl-matrix';

interface ndcToWorld {
  ndcX: number;
  ndcY: number;
  ndcZ: number;
  inverseVP: mat4;
}

/**
 * Normalized Device Coordinates
 * Разматывает точку из NDC-пространства [-1, 1] обратно в мировые координаты.
 *
 * Это обратная операция к рендеру: рендер идёт «мир → экран» через projection × view,
 * а здесь мы едем назад, «экран → мир», через ОБРАТНУЮ матрицу (inverseVP).
 *
 * ndcZ задаёт глубину точки: -1 — ближняя плоскость, 1 — дальняя.
 * Две такие точки (near и far) вместе задают луч для выбора.
 *
 * Деление на w (перспективное деление) обязательно: проекция умножала координаты на w,
 * поэтому при разматывании нужно поделить обратно — иначе для перспективной камеры
 * точка окажется неверной.
 */
export function ndcToWorld({ ndcX, ndcY, ndcZ, inverseVP }: ndcToWorld) {
  const clip = vec4.fromValues(ndcX, ndcY, ndcZ, 1);
  const world = vec4.transformMat4(vec4.create(), clip, inverseVP);
  return vec3.fromValues(world[0] / world[3], world[1] / world[3], world[2] / world[3]);
}
