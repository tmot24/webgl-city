// Единая форма плоской геометрии в мировых координатах (без нормалей - flat-материал их не использует)
import { CityBounds, RoadGrid } from '../city/generate-city.types';

export interface FlatGeometry {
  position: Float32Array;
  indices: Uint16Array;
  count: number;
}

interface BuildGeometryParams {
  road: RoadGrid;
  bounds: CityBounds;
}

// Дороги чуть приподняты над травой, чтобы не было z-fighting с землёй (y=0)
const ROAD_Y = 0.1;

// Дороги: прямоугольные полосы по линиям сетки, собранные в один меш (запекание)
// xLines - вертикальные дороги (вдоль Z), zLines - горизонтальные (вдоль X)
// Пересечения перекрываются - цвет один, поэтому не мешает.
export function buildRoadGeometry({ road, bounds }: BuildGeometryParams): FlatGeometry {
  const { xLines, zLines, width } = road;
  const half = width / 2;

  const positions: number[] = [];
  const indices: number[] = [];

  const addQuad = ({ x0, z0, x1, z1 }: { x0: number; z0: number; x1: number; z1: number }) => {
    const base = positions.length / 3;
    // это 4 вершины одного дорожного прямоугольника, по 3 числа (x, y, z)
    positions.push(x0, ROAD_Y, z0, x1, ROAD_Y, z0, x1, ROAD_Y, z1, x0, ROAD_Y, z1);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  // вертикальные дороги: полоса шириной width по X, на всю длину Z
  for (const x of xLines) {
    addQuad({
      x0: x - half,
      z0: bounds.minZ,
      x1: x + half,
      z1: bounds.maxZ,
    });
  }

  // горизонтальные дороги: полоса шириной width по Z, на всю длину X
  for (const z of zLines) {
    addQuad({
      x0: bounds.minX,
      z0: z - half,
      x1: bounds.maxX,
      z1: z + half,
    });
  }

  return {
    position: new Float32Array(positions),
    indices: new Uint16Array(indices),
    count: indices.length,
  };
}
