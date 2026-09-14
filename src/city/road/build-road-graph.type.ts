import { vec3 } from 'gl-matrix';

// Перекрёсток
export interface RoadNode {
  // i * zLines.length + j (совпадает с индексом), пригодится для A*
  id: number;
  // индекс линии по X (xLines)
  i: number;
  // индекс линии по Z (zLines)
  j: number;
  // перекрёсток в мире (y=0)
  position: vec3;
}

// Уникальное ребро
export interface RoadEdge {
  // id узла (a < b по построению)
  a: number;
  // id узла
  b: number;
  // длина участка, метры
  cost: number;
}

export interface RoadGraphAdjacencyValue {
  to: number;
  cost: number;
}

export interface RoadGraph {
  // перекрёстки; node[id] === узел с этим id
  nodes: RoadNode[];
  // уникальные рёбра
  edges: RoadEdge[];
  // соседи узла с ценой (обе стороны) - по этому А* и ходит
  adjacency: Map<number, RoadGraphAdjacencyValue[]>;
}

export interface RoadGraphLink {
  from: number;
  to: number;
  cost: number;
}

export interface RoadGraphConnect {
  a: number;
  b: number;
}
