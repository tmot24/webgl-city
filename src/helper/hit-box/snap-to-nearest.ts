import { mat4, vec3 } from 'gl-matrix';
import { worldToScreen } from './world-to-screen';

interface SnapToNearest {
  // мировые точки-кандидаты
  candidates: vec3[];
  // свободная точка под курсором (её проекция ≈ позиция курсора)
  cursorWorld: vec3;
  viewProjection: mat4;
  // CSS px
  width: number;
  // CSS px
  height: number;
  // px: ближе порога => прилипаем
  threshold: number;
}

/**
 * Ближайший кандидат к курсору в ЭКРАННЫХ пикселях (одинаково на любом зуме)
 * */
export function snapToNearest({
  candidates,
  cursorWorld,
  viewProjection,
  width,
  height,
  threshold,
}: SnapToNearest): vec3 | null {
  const cursor = worldToScreen({ point: cursorWorld, viewProjection, width, height });
  if (!cursor) return null;

  let best: vec3 | null = null;
  let bestDist = threshold; //принимаем только строго ближе порога
  for (const candidate of candidates) {
    const screen = worldToScreen({ point: candidate, viewProjection, width, height });
    if (!screen) continue;
    const dist = Math.hypot(screen.x - cursor.x, screen.y - cursor.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}
