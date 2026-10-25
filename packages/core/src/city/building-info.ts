// Средняя высота этажа, метры - для оценки этажности
import { Building } from './generate-city.types';

const FLOOR_HEIGHT = 3.5;

export interface BuildingInfo {
  id: number;
  height: string;
  width: string;
  depth: string;
  area: string;
  floors: number;
  x: string;
  z: string;
}

export function toBuildingInfo({ building }: { building: Building }): BuildingInfo {
  const { id, height, width, depth, cx, cz } = building;
  return {
    id,
    height: height.toFixed(2),
    width: width.toFixed(2),
    depth: depth.toFixed(2),
    area: (width * depth).toFixed(2),
    floors: Math.max(1, Math.round(height / FLOOR_HEIGHT)),
    x: cx.toFixed(0),
    z: cz.toFixed(0),
  };
}
