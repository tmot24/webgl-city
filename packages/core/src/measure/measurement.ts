import { vec3 } from 'gl-matrix';
import { ScreenProjector } from '../ray/create-screen-projector';

export interface MeasureSegment {
  a: vec3; // первая точка (мировые координаты)
  b: vec3; // вторая точка
}

export interface Measurement extends MeasureSegment {
  id: number;
}

// Строка лога измерений: всё уже отформатировано для вывода
export interface MeasureRow {
  id: number;
  length: string;
  horizontal: string;
  height: string;
  ax: string;
  ay: string;
  az: string;
  bx: string;
  by: string;
  bz: string;
}

// Подпись длины над отрезком, в CSS-пикселях
export interface MeasureLabelData {
  x: number;
  y: number;
  text: string;
}

// Длина, горизонталь, перепад высоты, координаты концов
export function toMeasureRow({ measurement: { id, a, b } }: { measurement: Measurement }): MeasureRow {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return {
    id,
    length: vec3.distance(a, b).toFixed(2),
    horizontal: Math.hypot(dx, dz).toFixed(2),
    height: Math.abs(dy).toFixed(2),
    ax: a[0].toFixed(0),
    ay: a[1].toFixed(0),
    az: a[2].toFixed(0),
    bx: b[0].toFixed(0),
    by: b[1].toFixed(0),
    bz: b[2].toFixed(0),
  };
}

// Подпись над серединой отрезка; null - середина за камерой
export function toMeasureLabel({
  segment: { a, b },
  project,
}: {
  segment: MeasureSegment;
  project: ScreenProjector;
}): MeasureLabelData | null {
  const screenPoint = project({ point: vec3.lerp(vec3.create(), a, b, 0.5) });
  if (!screenPoint) return null;

  return {
    x: screenPoint.x,
    y: screenPoint.y,
    text: `${vec3.distance(a, b).toFixed(2)} м`,
  };
}
