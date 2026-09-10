import { mat4, vec3 } from 'gl-matrix';
import { cssToNdc } from './css-to-ndc';
import { ndcToWorld } from './ndc-to-world';

interface ScreenPointToRay {
  event: MouseEvent;
  rect: DOMRect;
  viewProjection: mat4;
  eyePoint: vec3;
}

export interface Ray {
  // начало луча (камера)
  origin: vec3;
  // направление, нормализованное
  dir: vec3;
}

// Экранная точка (клилк) => луч в мире: из камеры через точку на дальней плоскости (ndcZ = 1).
export function screenPointToRay({ event, rect, viewProjection, eyePoint }: ScreenPointToRay): Ray | null {
  const { ndcX, ndcY } = cssToNdc({ event, rect });
  const inverseVP = mat4.invert(mat4.create(), viewProjection);
  if (!inverseVP) return null;
  const far = ndcToWorld({ ndcX, ndcY, ndcZ: 1, inverseVP });
  const origin = eyePoint;
  const dir = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), far, origin));
  return { origin, dir };
}
