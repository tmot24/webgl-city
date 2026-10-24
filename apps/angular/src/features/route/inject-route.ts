import { ElementRef, inject, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { GroundBounds, intersectGround } from '../../shared/ray/intersect-ground';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { nearestNode } from '../../city/road/nearest-node';
import { findPath } from '../../city/road/find-path';
import { RoadGrid } from '../../city/generate-city.types';
import { RouteStore } from './route.store';
import { buildRoadGraph } from '../../city/road/build-road-graph';
import { SceneModStore } from '../mode/scene-mod.store';

interface InjectRoute {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  road: RoadGrid;
  groundBounds: GroundBounds;
}

/**
 * Режим маршрута: клик по земле => ближайший перекрёсток (узел графа).
 * Граф и A* - здесь (побочный эффект), в RouteStore уходит только результат
 * */
export function injectRoute({ canvasRef, viewProjection, eyePoint, groundBounds, road }: InjectRoute) {
  const store = inject(RouteStore);
  const graph = buildRoadGraph({ road });

  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
    enabled: inject(SceneModStore).is.route,
    onClick: ({ origin, dirNorm }) => {
      const groundPoint = intersectGround({ origin, dirNorm: dirNorm, bounds: groundBounds });
      if (!groundPoint) return; // клик мимо земли

      const node = nearestNode({ graph, point: groundPoint.point });
      const start = store.start();

      // Нет точки A или маршрут уже построен => этот клик начинает новый
      if (start === null || !store.awaitingFinish()) {
        store.begin({ node });
        return;
      }

      // A есть, B нет => это B: стром маршрут A* между ними
      const ids = findPath({ graph, start, finish: node });
      store.complete({ node, path: ids?.map((id) => graph.nodes[id].position) ?? null });
    },
  });
}
