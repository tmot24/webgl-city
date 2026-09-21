import { injectMeasure, Measurement } from './inject-measure';
import { computed, ElementRef, signal, Signal, WritableSignal } from '@angular/core';
import { RoadGrid } from '../../city/generate-city.types';
import { mat4, vec3 } from 'gl-matrix';
import { GroundBounds } from '../../shared/ray/intersect-ground';
import { MeasureLabelData } from './measure-label/measure-label';
import { ScreenPoint, worldToScreen } from '../../shared/ray/world-to-screen';
import { BuildingBox } from '../../city/building-box';

interface InjectMeasureState {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildingBoxes: BuildingBox[];
  road: RoadGrid;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  groundBounds: GroundBounds;
  viewportSize: Signal<{ width: number; height: number }>;
  enabled: Signal<boolean>;
}

export interface MeasureState {
  measurements: WritableSignal<Measurement[]>;
  selectedMeasurementId: WritableSignal<number | null>;
  segment: Signal<{ a: vec3; b: vec3 } | null>;
  label: Signal<MeasureLabelData | null>;
  snapMarker: Signal<ScreenPoint | null>;
  remove: ({ id }: { id: number }) => void;
  reset: () => void;
}

export function injectMeasureState({
  canvasRef,
  buildingBoxes,
  road,
  viewProjection,
  eyePoint,
  groundBounds,
  viewportSize,
  enabled,
}: InjectMeasureState): MeasureState {
  const measurements = signal<Measurement[]>([]);
  const pendingPoint = signal<vec3 | null>(null);
  const cursorPoint = signal<vec3 | null>(null);
  // точка залипания
  const snapPoint = signal<vec3 | null>(null);
  // id выбранного в логе измерения
  const selectedMeasurementId = signal<number | null>(null);

  // Активный отрезок: тянущаяся линия, либо выбранное готовое измерение
  const segment = computed(() => {
    if (!enabled()) return null;
    const start = pendingPoint();
    if (start) {
      const cursor = cursorPoint();
      return cursor ? { a: start, b: cursor } : null;
    }
    const list = measurements();
    const selectedId = selectedMeasurementId();
    const chosen = selectedId !== null ? list.find(({ id }) => id === selectedId) : undefined;
    return chosen ? { a: chosen.a, b: chosen.b } : null;
  });
  // Экранная позиция подписи над серединой активного отрезка + текст длины
  const label = computed((): MeasureLabelData | null => {
    const seg = segment();
    if (!seg) return null;
    const { a, b } = seg;
    viewportSize(); // зависимость: пересчёт при ресйзе (значение из clientWidth)

    const canvas = canvasRef().nativeElement;
    const midPoint = vec3.lerp(vec3.create(), a, b, 0.5);
    const screenPoint = worldToScreen({
      point: midPoint,
      viewProjection: viewProjection(),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
    if (!screenPoint) return null; // точка за камерой

    const length = vec3.distance(a, b);
    return {
      x: screenPoint.x,
      y: screenPoint.y,
      text: `${length.toFixed(2)} м`,
    };
  });
  const snapMarker = computed(() => {
    const point = snapPoint();
    if (!point) return null;
    viewportSize(); // зависимость: пересчёт при ресайзе

    const canvas = canvasRef().nativeElement;
    return worldToScreen({
      point,
      viewProjection: viewProjection(),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  });

  const remove = ({ id }: { id: number }) => measurements.update((list) => list.filter((item) => item.id !== id));

  const reset = () => {
    pendingPoint.set(null);
    cursorPoint.set(null);
    snapPoint.set(null);
    selectedMeasurementId.set(null);
  };

  injectMeasure({
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
  });

  return { measurements, selectedMeasurementId, segment, label, snapMarker, remove, reset };
}
