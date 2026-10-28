import { vec3 } from 'gl-matrix';

export interface RouteInfo {
  length: string;
  crossings: number;
}
export function toRouteInfo({ path }: { path: vec3[] | null }): RouteInfo | null {
  if (!path || path.length === 0) return null;

  let length = 0;
  for (let i = 0; i < path.length - 1; i++) {
    length += vec3.distance(path[i], path[i + 1]);
  }

  return {
    length: length.toFixed(0),
    crossings: path.length,
  };
}
