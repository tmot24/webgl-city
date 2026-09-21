import { Ray } from '../shared/ray/screen-point-to-ray';
import { BuildingBox } from './building-box';
import { Building } from './generate-city.types';
import { rayBoxDistance } from '../shared/ray/ray-box-distance';

interface NearestBuildingHit {
  ray: Ray;
  buildingBoxes: BuildingBox[];
}

export interface BuildingHit {
  building: Building;
  // Расстояние вдоль луча до входа в коробку (точка = origin + distance * dir)
  distance: number;
}

/**
 * Ближайшее к камере здание, которое задевает луч. null - луч прошёл мимо всех зданий.
 * Перебор всех коробок: O(n), для одного луча на событие указателя этого достаточно.
 * */
export function nearestBuildingHit({
  ray: { origin, dirNorm },
  buildingBoxes,
}: NearestBuildingHit): BuildingHit | null {
  let nearest: BuildingHit | null = null;

  buildingBoxes.forEach(({ building, boxMin, boxMax }) => {
    const distance = rayBoxDistance({ origin, dirNorm, boxMin, boxMax });
    if (distance !== null && (nearest === null || distance < nearest.distance)) {
      nearest = { building, distance };
    }
  });

  return nearest;
}
