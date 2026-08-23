export function constructPlaneGeometry() {
  // квадрат 10*10 в плоскости XZ (горизонтальный пол), центр в (0,0,0)
  const half = 5;
  const points = [
    { coord: { x: -half, y: 0, z: -half } }, // 0 дальний-левый
    { coord: { x: -half, y: 0, z: half } }, // 1 ближний-левый
    { coord: { x: half, y: 0, z: half } }, // 2 ближний-правый
    { coord: { x: half, y: 0, z: -half } }, // 3 дальний-правый
  ];

  const position = new Float32Array(points.flatMap(({ coord: { x, y, z } }) => [x, y, z]));
  // нормаль пола - вверх (0,1,0), одинаковая на все 4 вершины
  const normal = new Float32Array(points.flatMap(() => [0, 1, 0]));
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  return { position, normal, indices, count: indices.length };
}
