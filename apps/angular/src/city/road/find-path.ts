import { RoadGraph } from './build-road-graph.type';
import { vec3 } from 'gl-matrix';
import { MinHeap } from '../../shared/data/min-heap';

interface FindPath {
  graph: RoadGraph;
  start: number; // id стартового узла
  finish: number; // id целевого узла
}

/**
 * A* по графу дорог. По формуле f(n) = g(n) "Дейкстра" + h(n) "жадный поиск".
 * Возвращает путь как список id узлов (start..finish), либо null, если пути нет.
 * Эвристика прямое расстояние до цели (согласованная: не переоценивает, т.к. цена ребра = его длина),
 * поэтому найденный путь гарантировано кратчайший. Дубликаты в куче гасим ленивым удалением (closed).
 * Согласованная - Сделал шаг в 10 м, и указатель показывает на 10 меньше (или меньше чем на 10, если шаг был не прямо к башне).
 * */
export function findPath({ graph, start, finish }: FindPath): number[] | null {
  const { nodes, path } = graph;

  const finishPosition = nodes[finish].position;
  // h: оценка оставшегося пути до цели - прямое расстояние
  const heuristic = (id: number) => vec3.distance(nodes[id].position, finishPosition);

  // g: длина лучшего известного пути от старта до этого узла
  const gScore = new Map<number, number>([[start, 0]]);
  // откуда пришли в узел по лучшему пути: to => from
  // Цепочка от цели назад к старту = сам путь (reconstruct)
  const cameFrom = new Map<number, number>();
  // Узлы, уже извлечённые из кучи: их g окончательный (кратчайший), больше не пересматриваем
  // корректно только при согласованной эвристике
  const closed = new Set<number>();

  // Кандидаты на обработку, приоритет f = g + h: первым достаём самый перспективный узел.
  // Узел может лежать в куче несколько раз - устаревшие копии отсекает closed
  const open = new MinHeap();
  open.push({ value: start, priority: heuristic(start) });

  while (open.size > 0) {
    // Куча гарантирует возвращение элемента с минимальным priority по f = g + h
    const current = open.pop()!;
    if (current === finish) {
      return reconstruct({ cameFrom, finish: current });
    }
    if (closed.has(current)) continue; // устаревший дубликат - уже обработан с меньшей ценой (ленивое)
    closed.add(current);

    for (const { to, cost } of path.get(current) ?? []) {
      if (closed.has(to)) continue;
      // Кандидат на g(to): длина пути до соседа, если идти через current.
      // Принимаем только если он короче уже известного пути до to
      const tentative = gScore.get(current)! + cost;
      // Лучшая известная длина пути до соседа
      const bestKnownG = gScore.get(to) ?? Infinity;
      if (tentative < bestKnownG) {
        gScore.set(to, tentative);
        cameFrom.set(to, current);
        const priority = tentative + heuristic(to);
        open.push({ value: to, priority }); // f = g + h
      }
    }
  }

  return null; // цель - недостижима
}

// Разворачиваем путь по cameFrom от цели к старту.
function reconstruct({ cameFrom, finish }: { cameFrom: Map<number, number>; finish: number }): number[] {
  const path = [finish];
  let current = finish;
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!;
    path.push(current);
  }
  return path.reverse();
}
