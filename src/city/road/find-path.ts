import { RoadGraph } from './build-road-graph.type';
import { vec3 } from 'gl-matrix';
import { MinHeap } from '../../shared/data/min-heap';

interface FindPath {
  graph: RoadGraph;
  start: number; // id стартового узла
  goal: number; // id целевого узла
}

/**
 * A* по графу дорог. Возвращает путь как список id узлов (start..goal), либо null, если пути нет.
 * Эвристика прямое расстояние до цели (допустимая: не переоценивает, т.к. цена ребра = его длина),
 * поэтому найденный путь гарантировано кратчайший. Дубликаты в куче гасим ленивым удалением (closed).
 * */
export function findPath({ graph, start, goal }: FindPath): number[] | null {
  const { nodes, adjacency } = graph;
  const goalPosition = nodes[goal].position;
  const heuristic = (id: number) => vec3.distance(nodes[id].position, goalPosition);

  const gScore = new Map<number, number>([[start, 0]]);
  const cameFrom = new Map<number, number>();
  const closed = new Set<number>();

  const open = new MinHeap<number>();
  open.push({ value: start, priority: heuristic(start) });

  while (open.size > 0) {
    const current = open.pop()!;
    if (current === goal) return reconstruct({ cameFrom, goal: current });
    if (closed.has(current)) continue; // устаревший дубликат - уже обработан с меньшей ценной
    closed.add(current);

    for (const { to, cost } of adjacency.get(current) ?? []) {
      if (closed.has(to)) continue;
      const tentative = gScore.get(current)! + cost;
      if (tentative < (gScore.get(to) ?? Infinity)) {
        gScore.set(to, tentative);
        cameFrom.set(to, current);
        open.push({ value: to, priority: tentative + heuristic(to) }); // f = g + h
      }
    }
  }

  return null; // цель - недостижима
}

// Разворачиваем путь по cameFrom от цели к старту.
function reconstruct({ cameFrom, goal }: { cameFrom: Map<number, number>; goal: number }): number[] {
  const path = [goal];
  let current = goal;
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!;
    path.push(current);
  }
  return path.reverse();
}
