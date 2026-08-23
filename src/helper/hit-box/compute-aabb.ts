import { vec3 } from 'gl-matrix';

interface ComputeAABBB {
  points: { x: number; y: number; z: number }[];
}

/**
 * Вычисляет осевую ограничивающую коробку (AABB - axis-aligned bounding box) из набора точек.
 * boxMin - покомпонентный минимум, boxMax - покомпонентный максимум.
 * */
export function computeAABB({ points }: ComputeAABBB) {
  // Стартуем с "перевёрнутых" границ: min с +бесконечности, max с -бесконечности,
  // тогда первая же точка их корректно задаст
  const boxMin = vec3.fromValues(Infinity, Infinity, Infinity);
  const boxMax = vec3.fromValues(-Infinity, -Infinity, -Infinity);

  points.forEach(({ x, y, z }) => {
    // по каждой оси оставляем меньшее для min и большее для max
    boxMin[0] = Math.min(boxMin[0], x);
    boxMin[1] = Math.min(boxMin[1], y);
    boxMin[2] = Math.min(boxMin[2], z);

    boxMax[0] = Math.max(boxMax[0], x);
    boxMax[1] = Math.max(boxMax[1], y);
    boxMax[2] = Math.max(boxMax[2], z);
  });

  return { boxMin, boxMax };
}
