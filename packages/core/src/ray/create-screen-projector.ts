import { mat4, vec3 } from 'gl-matrix';
import { ScreenPoint, worldToScreen } from './world-to-screen';

// Мир => CSS-пиксели canvas; null - точка за камерой
export type ScreenProjector = (params: { point: vec3 }) => ScreenPoint | null;

interface CreateScreenProjector {
  viewProjection: mat4;
  // размер canvas в CSS-пикселях
  width: number;
  height: number;
}

/**
 * Фиксирует камеру и размер экрана в одну функцию проекции.
 * Новая камера / ресайз => новый проектор (удобно как производное значение в computed).
 * */
export function createScreenProjector({ viewProjection, width, height }: CreateScreenProjector): ScreenProjector {
  return ({ point }) => worldToScreen({ point, viewProjection, width, height });
}
