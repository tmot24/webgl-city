import { Building } from './generate-city.types';

export const INSTANCE_FLOATS = 6;
export const INSTANCE_STRIDE = INSTANCE_FLOATS * Float32Array.BYTES_PER_ELEMENT; // 24 байта
export const TRANSLATION_OFFSET = 0;
export const SCALE_OFFSET = 3 * Float32Array.BYTES_PER_ELEMENT; // 12 байт

// Раскладка одного инстанса: translation (позиция на земле) + scale (габариты).
// Предполагается ЕДИНИЧНЫЙ КУБ, СТОЯЩИЙ НА ПОЛУ: x, z в [-0.5, 0.5], y в [0, 1].
// Тогда:
//  translation = [cx, 0, cz] - здание просто стоит на земле, поднимать не нужно;
//  scale = [width, height, depth] - реальные габариты;
export interface InstanceData {
  // interleaved: [tx, ty, tz, sx, sy, sz] на экземпляр; длина = count * INSTANCE_FLOATS
  data: Float32Array;
  // число экземпляров (зданий)
  count: number;
}

// Чистый маппинг Building[] => буфер экземпляра-атрибутов для drawElementsInstanced
export function buildInstanceData({ buildings }: { buildings: Building[] }): InstanceData {
  const count = buildings.length;
  const data = new Float32Array(count * INSTANCE_FLOATS);

  for (let i = 0; i < count; i++) {
    const { cx, cz, width, height, depth } = buildings[i];
    const offset = i * INSTANCE_FLOATS;

    // translation: позиция на земле. Y=0 - куб уже стоит на полу.
    // (ty оставляем в раскладке как vec3 - пригодиться под рельеф/подвалы без смены формата)
    data[offset + 0] = cx;
    data[offset + 1] = 0;
    data[offset + 2] = cz;

    // scale: реальные габариты
    data[offset + 3] = width;
    data[offset + 4] = height;
    data[offset + 5] = depth;
  }

  return { data, count };
}
