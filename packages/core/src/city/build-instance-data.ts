import { Building } from './generate-city.types';

// Экземпляр-атрибуты для drawElementsInstanced: два ПЛОТНЫХ массива по 3 float на здание.
// Два массива (а не чередующийся) - потому что createVAO делает один буфер на атрибут:
// так каждый идёт со stride 0 и divisor: 1, без ручной настройки offset и без дублирования буфера.
// Предполагается единичный куб на полу (X, Z в [-0.5, 0.5], Y в [0, 1]):
//  translation = [cx, 0, cz] - здание просто стоит на земле, поднимать не нужно;
//  scale = [width, height, depth] - реальные габариты;
export interface InstanceData {
  // count * 3: [x, y, z] на здание
  translations: Float32Array;
  // count * 3: [w, h, d] на здание
  scales: Float32Array;
  // число экземпляров (зданий)
  count: number;
}

// Чистый маппинг Building[] => буфер экземпляра-атрибутов для drawElementsInstanced
export function buildInstanceData({ buildings }: { buildings: Building[] }): InstanceData {
  const count = buildings.length;
  const translations = new Float32Array(count * 3);
  const scales = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const { cx, cz, width, height, depth } = buildings[i];
    const offset = i * 3;

    // translation: позиция на земле. Y=0 - куб уже стоит на полу.
    translations[offset + 0] = cx;
    translations[offset + 1] = 0;
    translations[offset + 2] = cz;

    // scale: реальные габариты
    scales[offset + 0] = width;
    scales[offset + 1] = height;
    scales[offset + 2] = depth;
  }

  return { translations, scales, count };
}
