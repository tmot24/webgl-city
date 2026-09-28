import { mat4, vec3 } from 'gl-matrix';
import { ElementRef, inject, Signal } from '@angular/core';
import { RoadGrid } from '../../city/generate-city.types';
import { GroundBounds, intersectGround } from '../../shared/ray/intersect-ground';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { Ray } from '../../shared/ray/screen-point-to-ray';
import { snapToNearest } from '../../shared/ray/snap-to-nearest';
import { buildingCorners } from '../../city/building-corners';
import { SNAP_PIXEL_THRESHOLD } from '../../shared/constants';
import { roadSnapCandidates } from '../../city/road/road-snap-candidates';
import { BuildingBox } from '../../city/building-box';
import { nearestBuildingHit } from '../../city/nearest-building-hit';
import { MeasureStore } from './measure.store';
import { SceneModStore } from '../mode/scene-mod.store';

interface InjectMeasure {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildingBoxes: BuildingBox[];
  road: RoadGrid;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  // Прямоугольник земли
  groundBounds: GroundBounds;
}

/**
 * Режим измерения
 * */
export function injectMeasure({
  canvasRef,
  buildingBoxes,
  road,
  viewProjection,
  eyePoint,
  groundBounds,
}: InjectMeasure) {
  const store = inject(MeasureStore);

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

  // Финальная точка с учётом прилипания: если задели здание - пробуем прилипнуть к его 8 углам
  const resolvePoint = ({ origin, dirNorm }: Ray) => {
    const hit = hitSurface({ origin, dirNorm });
    if (!hit) return null;
    const canvas = canvasRef().nativeElement;
    // навёл на дом => его 8 углов; навёл на землю => перекрёсток + его 4 угла
    const candidates = hit.building ? buildingCorners(hit.building) : roadSnapCandidates({ road, point: hit.point });

    const snapped = snapToNearest({
      candidates,
      cursorWorld: hit.point,
      viewProjection: viewProjection(),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      threshold: SNAP_PIXEL_THRESHOLD,
    });

    return snapped ? { point: snapped, snapped: true } : { point: hit.point, snapped: false };
  };

  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
    enabled: inject(SceneModStore).is.measure,
    onClick: (ray) => {
      const resolved = resolvePoint(ray);
      if (!resolved) return; // клик в небо
      store.placePoint({ point: resolved.point });
    },
    onMove: (ray) => {
      store.hover({ hit: resolvePoint(ray) });
    },
  });
}
