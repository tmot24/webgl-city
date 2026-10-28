import { mat4, vec3, vec4 } from 'gl-matrix';

interface WorldToScreen {
  // мировая точка
  point: vec3;
  // матрица камеры
  viewProjection: mat4;
  // ширина viewport в css пикселях
  width: number;
  // высота viewport в css пикселях
  height: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export function worldToScreen({ point, viewProjection, width, height }: WorldToScreen): ScreenPoint | null {
  const position = vec4.fromValues(point[0], point[1], point[2], 1);
  // точка в clip space [x, y, z, w] - то же, что gl_Position в вершинном шейдере
  const clip = vec4.transformMat4(vec4.create(), position, viewProjection);
  // w - глубина перед камерой (-z в пространстве камеры); <= 0 => точка позади камеры (для перспективной камеры)
  const w = clip[3];
  if (w <= 0) return null;

  const ndcX = clip[0] / w;
  const ndcY = clip[1] / w;
  const x = (ndcX * 0.5 + 0.5) * width; // преобразование от [-1, 1] в [0, 1]
  const y = (1 - (ndcY * 0.5 + 0.5)) * height; // ось экрана вниз => инвертируем Y
  return { x, y };
}
