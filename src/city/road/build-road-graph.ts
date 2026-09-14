import { vec3 } from 'gl-matrix';
import { RoadGrid } from '../generate-city.types';
import { RoadEdge, RoadGraph, RoadGraphConnect, RoadGraphLink, RoadNode } from './build-road-graph.type';

export function buildRoadGraph({ road }: { road: RoadGrid }) {
  const { xLines, zLines } = road;
  const nx = xLines.length;
  const nz = zLines.length;
  const nodeId = (i: number, j: number) => i * nz + j;

  const nodes: RoadNode[] = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      nodes.push({
        id: nodeId(i, j),
        i,
        j,
        position: vec3.fromValues(xLines[i], 0, zLines[j]),
      });
    }
  }

  const edges: RoadEdge[] = [];
  // Смежные
  const adjacency: RoadGraph['adjacency'] = new Map();

  const link = ({ from, to, cost }: RoadGraphLink) => {
    const list = adjacency.get(from);
    if (list) {
      list.push({ to, cost });
    } else {
      adjacency.set(from, [{ to, cost }]);
    }
  };

  const connect = ({ a, b }: RoadGraphConnect) => {
    const cost = vec3.distance(nodes[a].position, nodes[b].position);
    edges.push({ a, b, cost }); // a < b
    link({ from: a, to: b, cost });
    link({ from: b, to: a, cost }); // неориентированный граф - обе стороны смежности
  };

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const a = nodeId(i, j);
      // сосед справа (по X)
      if (i + 1 < nx) {
        connect({ a, b: nodeId(i + 1, j) });
      }
      // сосед сверху (по Z)
      if (j + 1 < nz) {
        connect({ a, b: nodeId(i, j + 1) });
      }
    }
  }

  return { nodes, edges, adjacency };
}
