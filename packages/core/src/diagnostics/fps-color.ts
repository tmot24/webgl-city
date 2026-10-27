// Цвет счётчика FPS по порогам: зелёный - плавно, жёлтый - терпимо, красный - тормозит
export function fpsColor({ fps }: { fps: number }): string {
  if (fps >= 55) return '#7ddc7d';
  if (fps >= 30) return '#e6c04d';
  return '#e06d6d';
}
