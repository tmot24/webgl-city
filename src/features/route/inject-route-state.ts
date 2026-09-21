import { computed, ElementRef, Signal, signal, WritableSignal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { injectRoute } from './inject-route';
import { GroundBounds } from '../../shared/ray/intersect-ground';
import { buildRoadGraph } from '../../city/road/build-road-graph';
import { RoadGrid } from '../../city/generate-city.types';
import { RoadGraph } from '../../city/road/build-road-graph.type';

interface InjectRouteState {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  enabled: Signal<boolean>;
  road: RoadGrid;
  groundBounds: GroundBounds;
}

export interface RouteState {
  route: WritableSignal<number[] | null>;
  routeInfo: Signal<{
    length: string;
    crossings: number;
  } | null>;
  awaitingSecond: Signal<boolean>;
  graph: RoadGraph;
  reset: () => void;
}

export function injectRouteState({
  canvasRef,
  viewProjection,
  eyePoint,
  road,
  groundBounds,
  enabled,
}: InjectRouteState): RouteState {
  const pointA = signal<number | null>(null);
  const pointB = signal<number | null>(null);
  const route = signal<number[] | null>(null);
  const routeInfo = computed(() => {
    const ids = route();
    if (!ids || ids.length === 0) return null;
    let length = 0;
    for (let k = 0; k < ids.length - 1; k++) {
      length += vec3.distance(graph.nodes[ids[k]].position, graph.nodes[ids[k + 1]].position);
    }
    return { length: length.toFixed(0), crossings: ids.length };
  });
  const awaitingSecond = computed(() => pointA() !== null && route() === null);

  const graph = buildRoadGraph({ road });

  injectRoute({
    canvasRef,
    viewProjection,
    eyePoint,
    graph,
    groundBounds,
    pointA,
    pointB,
    route,
    enabled,
  });

  const reset = () => {
    pointA.set(null);
    pointB.set(null);
    route.set(null);
  };

  return { route, routeInfo, awaitingSecond, graph, reset };
}
