// Каждая грань — 4 точки против часовой стрелки.
// texCoord: стандартная раскладка углов грани (u,v) — texture натягивается на всю грань.
// Порядок UV соответствует порядку точек: верх-право → верх-лево → низ-лево → низ-право
export const CUBE_FACE = [
  {
    normal: { x: 0, y: 0, z: 1 }, // передняя (+Z)
    points: [
      { coord: { x: 0.5, y: 1, z: 0.5 }, color: { r: 1, g: 0, b: 0 }, texCoord: { u: 1, v: 1 } },
      { coord: { x: -0.5, y: 1, z: 0.5 }, color: { r: 1, g: 0, b: 0 }, texCoord: { u: 0, v: 1 } },
      { coord: { x: -0.5, y: 0, z: 0.5 }, color: { r: 1, g: 0, b: 0 }, texCoord: { u: 0, v: 0 } },
      { coord: { x: 0.5, y: 0, z: 0.5 }, color: { r: 1, g: 0, b: 0 }, texCoord: { u: 1, v: 0 } },
    ],
  },
  {
    normal: { x: 1, y: 0, z: 0 }, // правая (+X)
    points: [
      { coord: { x: 0.5, y: 1, z: -0.5 }, color: { r: 0, g: 1, b: 0 }, texCoord: { u: 1, v: 1 } },
      { coord: { x: 0.5, y: 1, z: 0.5 }, color: { r: 0, g: 1, b: 0 }, texCoord: { u: 0, v: 1 } },
      { coord: { x: 0.5, y: 0, z: 0.5 }, color: { r: 0, g: 1, b: 0 }, texCoord: { u: 0, v: 0 } },
      { coord: { x: 0.5, y: 0, z: -0.5 }, color: { r: 0, g: 1, b: 0 }, texCoord: { u: 1, v: 0 } },
    ],
  },
  {
    normal: { x: 0, y: 1, z: 0 }, // верхняя (+Y)
    points: [
      { coord: { x: 0.5, y: 1, z: -0.5 }, color: { r: 0, g: 0, b: 1 }, texCoord: { u: 1, v: 1 } },
      { coord: { x: -0.5, y: 1, z: -0.5 }, color: { r: 0, g: 0, b: 1 }, texCoord: { u: 0, v: 1 } },
      { coord: { x: -0.5, y: 1, z: 0.5 }, color: { r: 0, g: 0, b: 1 }, texCoord: { u: 0, v: 0 } },
      { coord: { x: 0.5, y: 1, z: 0.5 }, color: { r: 0, g: 0, b: 1 }, texCoord: { u: 1, v: 0 } },
    ],
  },
  {
    normal: { x: -1, y: 0, z: 0 }, // левая (-X)
    points: [
      { coord: { x: -0.5, y: 1, z: 0.5 }, color: { r: 1, g: 1, b: 0 }, texCoord: { u: 1, v: 1 } },
      { coord: { x: -0.5, y: 1, z: -0.5 }, color: { r: 1, g: 1, b: 0 }, texCoord: { u: 0, v: 1 } },
      { coord: { x: -0.5, y: 0, z: -0.5 }, color: { r: 1, g: 1, b: 0 }, texCoord: { u: 0, v: 0 } },
      { coord: { x: -0.5, y: 0, z: 0.5 }, color: { r: 1, g: 1, b: 0 }, texCoord: { u: 1, v: 0 } },
    ],
  },
  {
    normal: { x: 0, y: -1, z: 0 }, // нижняя (-Y)
    points: [
      { coord: { x: -0.5, y: 0, z: -0.5 }, color: { r: 0, g: 1, b: 1 }, texCoord: { u: 1, v: 1 } },
      { coord: { x: 0.5, y: 0, z: -0.5 }, color: { r: 0, g: 1, b: 1 }, texCoord: { u: 0, v: 1 } },
      { coord: { x: 0.5, y: 0, z: 0.5 }, color: { r: 0, g: 1, b: 1 }, texCoord: { u: 0, v: 0 } },
      { coord: { x: -0.5, y: 0, z: 0.5 }, color: { r: 0, g: 1, b: 1 }, texCoord: { u: 1, v: 0 } },
    ],
  },
  {
    normal: { x: 0, y: 0, z: -1 }, // задняя (-Z)
    points: [
      { coord: { x: -0.5, y: 1, z: -0.5 }, color: { r: 1, g: 0, b: 1 }, texCoord: { u: 1, v: 1 } },
      { coord: { x: 0.5, y: 1, z: -0.5 }, color: { r: 1, g: 0, b: 1 }, texCoord: { u: 0, v: 1 } },
      { coord: { x: 0.5, y: 0, z: -0.5 }, color: { r: 1, g: 0, b: 1 }, texCoord: { u: 0, v: 0 } },
      { coord: { x: -0.5, y: 0, z: -0.5 }, color: { r: 1, g: 0, b: 1 }, texCoord: { u: 1, v: 0 } },
    ],
  },
];
