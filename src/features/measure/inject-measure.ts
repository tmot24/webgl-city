import { mat4, vec3 } from 'gl-matrix';
import { ElementRef, Signal, WritableSignal } from '@angular/core';
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

export interface Measurement {
  id: number;
  a: vec3; // первая точка (мировые координаты)
  b: vec3; // вторая точка
}

interface InjectMeasure {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildingBoxes: BuildingBox[];
  road: RoadGrid;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  // завершённые измерения (пары точек)
  measurements: WritableSignal<Measurement[]>;
  // первая поставленная точка, ждём вторую (null - начинаем новое измерение)
  pendingPoint: WritableSignal<vec3 | null>;
  // точка под курсором на поверхности (null в небе)
  cursorPoint: WritableSignal<vec3 | null>;
  // выбранное измерение
  selectedMeasurementId: WritableSignal<number | null>;
  // точка залипания к углу здания (для маркера)
  snapPoint: WritableSignal<vec3 | null>;
  // Прямоугольник земли
  groundBounds: GroundBounds;
  // включён ли режим измерения (Scene выводит из activeMode)
  enabled: Signal<boolean>;
}

export function injectMeasure({
  canvasRef,
  buildingBoxes,
  road,
  viewProjection,
  eyePoint,
  measurements,
  pendingPoint,
  cursorPoint,
  snapPoint,
  selectedMeasurementId,
  groundBounds,
  enabled,
}: InjectMeasure) {
  let nextId = 1;

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
    enabled,
    onClick: ({ origin, dirNorm }) => {
      const resolved = resolvePoint({ origin, dirNorm });
      if (!resolved) return; // клик в небо
      const point = resolved.point;

      const first = pendingPoint();
      if (!first) {
        pendingPoint.set(point); // первая точка отрезка
        selectedMeasurementId.set(null); // сброс выбора
      } else {
        const id = nextId++;
        measurements.update((list) => [...list, { id, a: first, b: point }]);
        selectedMeasurementId.set(id); // сброс выбора
        pendingPoint.set(null); // измерение завершено, следующий клик начнёт новое
        cursorPoint.set(null); // резинка больше не нужна
      }
    },
    onMove: ({ origin, dirNorm }) => {
      const resolved = resolvePoint({ origin, dirNorm });
      snapPoint.set(resolved?.snapped ? resolved.point : null); // маркер залипания (даже до первого клика)
      if (!pendingPoint()) return; // резинка только между первой и второй точкой
      cursorPoint.set(resolved ? resolved.point : null); // null в небе => резинка скрыта
    },
  });
}
