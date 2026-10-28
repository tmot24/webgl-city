import { Ray } from '../ray/screen-point-to-ray';
import { vec3 } from 'gl-matrix';
import { RoadGrid } from '../city/generate-city.types';
import { GroundBounds, intersectGround } from '../ray/intersect-ground';
import { buildRoadGraph } from '../city/road/build-road-graph';
import { nearestNode } from '../city/road/nearest-node';
import { findPath } from '../city/road/find-path';

export interface RoutePlanner {
  // ближайший перекрёсток (id узла графа) под лучом; null - луч мимо земли
  nodeAt: (params: { ray: Ray }) => number | null;
  // кратчайший путь A* как точки в мире; null - пути нет
  findRoute: (params: { start: number; finish: number }) => vec3[] | null;
}

interface CreateRoutePlanner {
  road: RoadGrid;
  groundBounds: GroundBounds;
}

/**
 * Навигация по дорожной сети: граф строится один раз при создании.
 * О состоянии маршрута (точка A, B) не знает - это дело store.
 * */
export function createRoutePlanner({ road, groundBounds }: CreateRoutePlanner): RoutePlanner {
  const graph = buildRoadGraph({ road });

  return {
    nodeAt: ({ ray: { origin, dirNorm } }) => {
      const groundHit = intersectGround({ origin, dirNorm, bounds: groundBounds });
      return groundHit ? nearestNode({ graph, point: groundHit.point }) : null;
    },
    findRoute: ({ start, finish }) => {
      return findPath({ graph, start, finish })?.map((id) => graph.nodes[id].position) ?? null;
    },
  };
}
