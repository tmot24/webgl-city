import { RoadGrid } from '../generate-city.types';
import { vec3 } from 'gl-matrix';

interface RoadSnapCandidates {
  road: RoadGrid;
  point: vec3; // точка курсора на земле
}

export function roadSnapCandidates({ road: { xLines, zLines, width }, point }: RoadSnapCandidates): vec3[] {
  if (!xLines.length || !zLines.length) return [];

  const x = nearest({ values: xLines, target: point[0] });
  const z = nearest({ values: zLines, target: point[2] });
  const half = width / 2;

  return [
    vec3.fromValues(x, 0, z), // центр перекрёстка
    vec3.fromValues(x - half, 0, z - half), // 4 угла перекрёстка
    vec3.fromValues(x + half, 0, z - half),
    vec3.fromValues(x + half, 0, z + half),
    vec3.fromValues(x - half, 0, z + half),
  ];
}

function nearest({ values, target }: { values: number[]; target: number }) {
  let best = values[0];
  let bestDist = Math.abs(best - target);
  for (const value of values) {
    const dist = Math.abs(value - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = value;
    }
  }

  return best;
}
