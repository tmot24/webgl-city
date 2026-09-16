import { ElementRef, Signal, WritableSignal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { RoadGraph } from '../../city/road/build-road-graph.type';
import { GroundBounds, intersectGround } from '../../shared/ray/intersect-ground';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { nearestNode } from '../../city/road/nearest-node';
import { findPath } from '../../city/road/find-path';

interface InjectRoute {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  enabled: Signal<boolean>;
  graph: RoadGraph;
  groundBounds: GroundBounds;
  // A и B как id узлов графа + найденный маршрут (список id узлов)
  pointA: WritableSignal<number | null>;
  pointB: WritableSignal<number | null>;
  route: WritableSignal<number[] | null>;
}

/**
 * Режим маршрута: клик по земле => ближайший перекрёсток (узел графа).
 * */
export function injectRoute({
  canvasRef,
  viewProjection,
  eyePoint,
  enabled,
  graph,
  groundBounds,
  pointA,
  pointB,
  route,
}: InjectRoute) {
  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
    enabled,
    onClick: ({ origin, dir }) => {
      const point = intersectGround({ origin, dir, bounds: groundBounds });
      if (!point) return; // клик мимо земли

      const node = nearestNode({ graph, point });
      const start = pointA();

      if (start === null || pointB() !== null) {
        pointA.set(node);
        pointB.set(null);
        route.set(null);
        return;
      }

      // A есть, B нет => это B: стром маршрут A* между ними
      pointB.set(node);
      route.set(findPath({ graph, start, goal: node }));
    },
  });
}
