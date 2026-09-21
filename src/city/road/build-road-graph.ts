import { vec3 } from 'gl-matrix';
import { RoadGrid } from '../generate-city.types';
import { RoadEdge, RoadGraph, RoadGraphConnect, RoadGraphLink, RoadNode } from './build-road-graph.type';

export function buildRoadGraph({ road }: { road: RoadGrid }): RoadGraph {
  const { xLines, zLines } = road;
  const nx = xLines.length;
  const nz = zLines.length;
  const nodeId = (x: number, z: number) => x * nz + z;

  const nodes: RoadNode[] = [];
  // Декартово произведение линий: каждый перекрёсток получает свою точку
  for (let x = 0; x < nx; x++) {
    for (let z = 0; z < nz; z++) {
      nodes.push({
        id: nodeId(x, z),
        xIndex: x,
        zIndex: z,
        position: vec3.fromValues(xLines[x], 0, zLines[z]),
      });
    }
  }

  // Рёбра
  const edges: RoadEdge[] = [];
  // Пути
  const path: RoadGraph['path'] = new Map();

  const link = ({ from, to, cost }: RoadGraphLink) => {
    const list = path.get(from);
    if (list) {
      list.push({ to, cost });
    } else {
      path.set(from, [{ to, cost }]);
    }
  };

  const connect = ({ a, b }: RoadGraphConnect) => {
    const cost = vec3.distance(nodes[a].position, nodes[b].position);
    edges.push({ a, b, cost }); // a < b
    link({ from: a, to: b, cost });
    link({ from: b, to: a, cost }); // неориентированный граф - обе стороны смежности
  };

  for (let x = 0; x < nx; x++) {
    for (let z = 0; z < nz; z++) {
      const a = nodeId(x, z);
      // сосед по X+
      if (x + 1 < nx) {
        connect({ a, b: nodeId(x + 1, z) });
      }
      // сосед по Z+
      if (z + 1 < nz) {
        connect({ a, b: nodeId(x, z + 1) });
      }
    }
  }

  return { nodes, edges, path };
}
