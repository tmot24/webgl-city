import { Building } from './generate-city.types';
import { vec3 } from 'gl-matrix';

// 8 углов коробки здания: 4 нижних (на земле, y=0) + 4 верхних (крыша, y=height)
export function buildingCorners({ cx, cz, width, depth, height }: Building): vec3[] {
  const minX = cx - width / 2;
  const maxX = cx + width / 2;
  const minZ = cz - depth / 2;
  const maxZ = cz + depth / 2;

  const corners: vec3[] = [];
  for (const y of [0, height]) {
    corners.push(
      vec3.fromValues(minX, y, minZ),
      vec3.fromValues(maxX, y, minZ),
      vec3.fromValues(maxX, y, maxZ),
      vec3.fromValues(minX, y, maxZ),
    );
  }

  return corners;
}
