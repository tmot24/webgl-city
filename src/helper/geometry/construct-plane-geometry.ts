interface ConstructPlaneGeometry {
  width?: number;
  depth?: number;
}

// Горизонтальный квадрат в плоскости XZ (пол), центр в (0,0,0), нормаль вверх.
export function constructPlaneGeometry({ width = 1, depth = 1 }: ConstructPlaneGeometry) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  const points = [
    { coord: { x: -halfWidth, y: 0, z: -halfDepth } }, // 0 дальний-левый
    { coord: { x: -halfWidth, y: 0, z: halfDepth } }, // 1 ближний-левый
    { coord: { x: halfWidth, y: 0, z: halfDepth } }, // 2 ближний-правый
    { coord: { x: halfWidth, y: 0, z: -halfDepth } }, // 3 дальний-правый
  ];

  const position = new Float32Array(points.flatMap(({ coord: { x, y, z } }) => [x, y, z]));
  // нормаль пола - вверх (0,1,0), одинаковая на все 4 вершины
  const normal = new Float32Array(points.flatMap(() => [0, 1, 0]));
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  return { position, normal, indices, count: indices.length };
}
