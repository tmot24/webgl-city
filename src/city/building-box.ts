import { Building } from './generate-city.types';
import { vec3 } from 'gl-matrix';

// Здание + его AABB (axis-aligned bounding box) для лучевых проверок.
export interface BuildingBox {
  building: Building;
  // Ближний-нижний-левый угол коробки: покомпонентный минимум [minX, minY, minZ]
  boxMin: vec3;
  // Дальний-верхний-правый угол коробки: покомпонентный максимум [maxX, maxY, maxZ]
  boxMax: vec3;
}

interface BuildingBoxes {
  buildings: Building[];
}

// AABB здания: от земли (y=0) до крыши (y=height)
export function buildingBox({ buildings }: BuildingBoxes): BuildingBox[] {
  return buildings.map((building) => {
    const { cx, cz, height, depth, width } = building;
    return {
      building,
      boxMin: vec3.fromValues(cx - width / 2, 0, cz - depth / 2),
      boxMax: vec3.fromValues(cx + width / 2, height, cz + depth / 2),
    };
  });
}
