import { mat4, vec3 } from 'gl-matrix';
import { Ray } from '../ray/screen-point-to-ray';
import { BuildingBox } from '../city/building-box';
import { RoadGrid } from '../city/generate-city.types';
import { GroundBounds, intersectGround } from '../ray/intersect-ground';
import { nearestBuildingHit } from '../city/nearest-building-hit';
import { buildingCorners } from '../city/building-corners';
import { roadSnapCandidates } from '../city/road/road-snap-candidates';
import { snapToNearest } from '../ray/snap-to-nearest';
import { SNAP_PIXEL_THRESHOLD } from '../constants';

export interface MeasurePoint {
  point: vec3;
  // точка прилипла к углу здания / перекрёстку
  snapped: boolean;
}

export interface MeasurePicker {
  resolve: (params: {
    ray: Ray;
    viewProjection: mat4;
    // размер canvas в CSS-пикселях - порог прилипания задан в экранных пикселях
    width: number;
    height: number;
  }) => MeasurePoint | null;
}

interface CreateMeasurePicker {
  buildingBoxes: BuildingBox[];
  road: RoadGrid;
  groundBounds: GroundBounds;
}

export function createMeasurePicker({ buildingBoxes, road, groundBounds }: CreateMeasurePicker): MeasurePicker {
  // Ближайшая поверхность вдоль луча + какое здание задето
  const hitSurface = ({ origin, dirNorm }: Ray) => {
    const groundHit = intersectGround({ origin, dirNorm, bounds: groundBounds });
    const buildingHit = nearestBuildingHit({ ray: { origin, dirNorm }, buildingBoxes });
    // dirNorm нормализован => обе distance в метрах вдоль одного луча и сравнимы.
    // Нет земли под лучом => Infinity: любое здание ближе.
    const groundDistance = groundHit?.distance ?? Infinity;

    if (buildingHit && buildingHit.distance < groundDistance) {
      return {
        point: vec3.scaleAndAdd(vec3.create(), origin, dirNorm, buildingHit.distance),
        building: buildingHit.building,
      };
    }
    if (groundHit) {
      return {
        point: groundHit.point,
        building: null,
      };
    }

    return null;
  };

  const resolve: MeasurePicker['resolve'] = ({ ray, viewProjection, width, height }) => {
    const hit = hitSurface(ray);
    if (!hit) return null;

    // навёл на дом => его 8 углов; навёл на землю => перекрёсток + его 4 угла
    const candidates = hit.building ? buildingCorners(hit.building) : roadSnapCandidates({ road, point: hit.point });

    const snapped = snapToNearest({
      candidates,
      cursorWorld: hit.point,
      viewProjection,
      width,
      height,
      threshold: SNAP_PIXEL_THRESHOLD,
    });

    return snapped ? { point: snapped, snapped: true } : { point: hit.point, snapped: false };
  };

  return {
    resolve,
  };
}
