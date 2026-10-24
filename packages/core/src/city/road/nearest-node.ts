import { RoadGraph } from './build-road-graph.type';
import { vec3 } from 'gl-matrix';

/**
 * Ближайший узел графа (перекрёсток) к точке на земле.
 * Линейный перебор: узлов немного, а клик редкий - оптимизировать незачем.
 * */
export function nearestNode({ graph, point }: { graph: RoadGraph; point: vec3 }): number {
  let bestId = graph.nodes[0].id;
  let bestDistance = Infinity;
  for (const node of graph.nodes) {
    // Квадрат - сравнивать дешевле (без sqrt)
    const distance = vec3.squaredDistance(node.position, point);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = node.id;
    }
  }
  return bestId;
}
