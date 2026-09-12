import { mat4, vec3 } from 'gl-matrix';
import { ElementRef, Signal, WritableSignal } from '@angular/core';
import { Building, RoadGrid } from '../../city/generate-city.types';
import { GroundBounds, intersectGround } from '../../shared/ray/intersect-ground';
import { rayBoxDistance } from '../../shared/ray/ray-box-distance';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { Ray } from '../../shared/ray/screen-point-to-ray';
import { snapToNearest } from '../../shared/ray/snap-to-nearest';
import { buildingCorners } from '../../city/building-corners';
import { SNAP_PIXEL_THRESHOLD } from '../../shared/constants';
import { roadSnapCandidates } from '../../road/road-snap-candidates';

export interface Measurement {
  id: number;
  a: vec3; // первая точка (мировые координаты)
  b: vec3; // вторая точка
}

interface InjectMeasure {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildings: Building[];
  road: RoadGrid;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  // завершённые измерения (пары точек)
  measurements: WritableSignal<Measurement[]>;
  // первая поставленная точка, ждём вторую (null - начинаем новое измерение)
  pending: WritableSignal<vec3 | null>;
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
  buildings,
  road,
  viewProjection,
  eyePoint,
  measurements,
  pending,
  cursorPoint,
  snapPoint,
  selectedMeasurementId,
  groundBounds,
  enabled,
}: InjectMeasure) {
  let nextId = 1;

  // Ближайшая поверхность вдоль луча + какое здание задето (null - земля). null - мимо всего (небо).
  const hitSurface = ({ origin, dir }: Ray) => {
    let best: { point: vec3; building: Building | null } | null = null;
    let bestT = Infinity; // T - математическое, расстояние луча до точки пересечения

    const ground = intersectGround({ origin, dir, bounds: groundBounds });
    if (ground) {
      const t = vec3.distance(origin, ground); // dir - нормализован => t = расстояние
      bestT = t;
      best = { point: ground, building: null };
    }

    for (const building of buildings) {
      const { cx, cz, height, depth, width } = building;
      const boxMin = vec3.fromValues(cx - width / 2, 0, cz - depth / 2);
      const boxMax = vec3.fromValues(cx + width / 2, height, cz + depth / 2);
      const t = rayBoxDistance({ origin, dir, boxMin, boxMax });
      if (t !== null && t < bestT) {
        bestT = t;
        best = { point: vec3.scaleAndAdd(vec3.create(), origin, dir, t), building };
      }
    }

    return best;
  };

  // Финальная точка с учётом прилипания: если задели здание - пробуем прилипнуть к его 8 углам
  const resolvePoint = ({ origin, dir }: Ray) => {
    const hit = hitSurface({ origin, dir });
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
    onClick: ({ origin, dir }) => {
      const resolved = resolvePoint({ origin, dir });
      if (!resolved) return; // клик в небо
      const point = resolved.point;

      const first = pending();
      if (!first) {
        pending.set(point); // первая точка отрезка
        selectedMeasurementId.set(null); // сброс выбора
      } else {
        const id = nextId++;
        measurements.update((list) => [...list, { id, a: first, b: point }]);
        selectedMeasurementId.set(id); // сброс выбора
        pending.set(null); // измерение завершено, следующий клик начнёт новое
        cursorPoint.set(null); // резинка больше не нужна
      }
    },
    onMove: ({ origin, dir }) => {
      const resolved = resolvePoint({ origin, dir });
      snapPoint.set(resolved?.snapped ? resolved.point : null); // маркер залипания (даже до первого клика)
      if (!pending()) return; // резинка только между первой и второй точкой
      cursorPoint.set(resolved ? resolved.point : null); // null в небе => резинка скрыта
    },
  });
}
