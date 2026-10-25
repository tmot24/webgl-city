import { SceneMode } from './scene-mode';
import { MeasureSegment } from '../measure/measurement';
import { vec3 } from 'gl-matrix';

interface SelectActivePolyline {
  mode: SceneMode;
  // текущий отрезок измерения
  segment: MeasureSegment | null;
  // построенный маршрут
  routePath: vec3[] | null;
}

// Что рисовать линией поверх сцены - зависит от активного режима
export function selectActivePolyline({ mode, segment, routePath }: SelectActivePolyline): vec3[] | null {
  switch (mode) {
    case 'measure':
      return segment ? [segment.a, segment.b] : null;
    case 'route':
      return routePath;
    default:
      return null;
  }
}
