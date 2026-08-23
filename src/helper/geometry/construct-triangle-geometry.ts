export function constructTriangleGeometry() {
  // вертикальный треугольник в плоскости XY (нормаль смотрит вдоль +Z)
  const points = [
    { coord: { x: 0, y: 1.5, z: 0 } }, // 0 вершина
    { coord: { x: -1.5, y: -1.5, z: 0 } }, // 1 левый низ
    { coord: { x: 1.5, y: -1.5, z: 0 } }, // 2 правый низ
  ];

  const position = new Float32Array(points.flatMap(({ coord: { x, y, z } }) => [x, y, z]));
  // нормаль треугольника - вдоль +Z, одинаковая на все 3 вершины
  const normal = new Float32Array(points.flatMap(() => [0, 0, 1]));
  const indices = new Uint16Array([0, 1, 2]);

  return { position, normal, indices, count: indices.length };
}
