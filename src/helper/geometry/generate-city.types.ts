// Одно здание: центр основания на земле (y = 0) + габариты коробки.
// Семантика (footprint + высота), а не матрица - так удобнее для UI и измерений.
// Будет выводиться инстанс-трансформ:
//  translation = [cx, height / 2, cz], scale = [width, height, depth].
export interface Building {
  id: number;
  // центр по X (метры)
  cx: number;
  // центр по Z (метры)
  cz: number;
  // размер по X
  width: number;
  // размер по Z
  depth: number;
  // высота (по Y, вверх)
  height: number;
}

// Разметка дорог регулярной сеткой: центральные линии + ширина.
// Этого достаточно и для отрисовки, и для графа маршрутов
export interface RoadGrid {
  // xLines - вертикальные дороги (идут вдоль Z), заданы X-координатой.
  xLines: number[];
  // zLines - горизонтальные дороги (идут вдоль X), заданы Z-координатой.
  zLines: number[];
  width: number;
}

export interface CityBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface City {
  buildings: Building[];
  road: RoadGrid;
  bounds: CityBounds; // для камеры (fit) и подготовки карты теней
}

export interface GenerateCityParams {
  seed?: number;
  // город gridBlocks * gridBlocks кварталов
  gridBlocks?: number;
  // сторона квартала без дорог, метры
  blockSize?: number;
  // ширина дороги, метры
  roadWidth?: number;
  // участков вдоль стороны квартала (plotsPerAxis^2 зданий на квартал)
  plotsPerAxis?: number;
  // отступ здания от края участка (промежутки между домами), метры
  plotMargin?: number;
  // минимальная высота, метры
  minHeight?: number;
  // максимальная высота
  maxHeight?: number;
  // смещение высот: >1 - больше низких, редкие высотки
  heightBias?: number;
  // вероятность оставить участок пустым (двор/сквер)
  emptyChance?: number;
}
