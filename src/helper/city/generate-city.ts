import { Building, City, GenerateCityParams } from './generate-city.types';
import { createRng } from '../geometry/create-rng';

export function generateCity({
  seed = 1,
  gridBlocks = 24,
  blockSize = 50,
  roadWidth = 10,
  plotsPerAxis = 2,
  plotMargin = 3,
  minHeight = 10,
  maxHeight = 120,
  heightBias = 2.2,
  emptyChance = 0.12,
}: GenerateCityParams): City {
  const rng = createRng({ seed });

  // Полный размер города по оси: кварталы + дороги между ними и по краям.
  const span = gridBlocks * blockSize + (gridBlocks + 1) * roadWidth;
  // левый/верхний край - центрируем сцену в начале координат
  const origin = -span / 2;

  // Левый край квартала с индексом i (сразу после i-й дороги)
  const blockStart = (i: number) => origin + roadWidth + i * (blockSize + roadWidth);

  const plotSize = blockSize / plotsPerAxis;
  // доступное под здание
  const innerSize = plotSize - 2 * plotMargin;

  const buildings: Building[] = [];
  let id = 0;

  for (let bx = 0; bx < gridBlocks; bx++) {
    for (let bz = 0; bz < gridBlocks; bz++) {
      const x0 = blockStart(bx);
      const z0 = blockStart(bz);

      for (let px = 0; px < plotsPerAxis; px++) {
        for (let pz = 0; pz < plotsPerAxis; pz++) {
          if (rng.chance(emptyChance)) continue; // пустой участок для разнообразия

          // Центр участка
          const cx = x0 + (px + 0.5) * plotSize;
          const cz = z0 + (pz + 0.5) * plotSize;

          const width = innerSize * rng.range({ min: 0.7, max: 1 });
          const depth = innerSize * rng.range({ min: 0.7, max: 1 });

          // Смещённое распределение: много низких зданий, редкие высотки.
          const t = Math.pow(rng.next(), heightBias);
          const height = minHeight + (maxHeight - minHeight) * t;

          buildings.push({ id: id++, cx, cz, width, depth, height });
        }
      }
    }
  }

  // Дороги: gridBlocks + 1 линий на ось, центр каждой - посередине дорожной полосы.
  const lines: number[] = [];
  for (let i = 0; i < gridBlocks; i++) {
    lines.push(origin + roadWidth / 2 + i * (blockSize + roadWidth));
  }

  return {
    buildings,
    road: {
      xLines: [...lines],
      zLines: [...lines],
      width: roadWidth,
    },
    bounds: {
      minX: origin,
      maxX: origin + span,
      minZ: origin,
      maxZ: origin + span,
    },
  };
}
