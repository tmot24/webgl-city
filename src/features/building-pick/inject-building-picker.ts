import { ElementRef, Signal, WritableSignal } from '@angular/core';
import { Building } from '../../city/generate-city.types';
import { mat4, vec3 } from 'gl-matrix';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { nearestBuildingHit } from '../../city/nearest-building-hit';
import { BuildingBox } from '../../city/building-box';

interface InjectBuildingPicker {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  // коробки зданий (строятся один раз в Scene)
  buildingBoxes: BuildingBox[];
  // матрица камеры (функция - читает текущее состояние камеры)
  viewProjection: () => mat4;
  // позиция камеры - начало луча выбора
  eyePoint: Signal<vec3>;
  // куда писать выбор
  selected: WritableSignal<Building | null>;
  // включён ли режим выбора (Scene выводит из activeMode)
  enabled: Signal<boolean>;
}

/**
 * Выбор зданий: клик ЛКМ => луч из камеры через точку клика => ближайшее задетое здание.
 * Возвращает сигнал выбранного здания (null - клик мимо, выделение снято).
 * */
export function injectBuildingPicker({
  canvasRef,
  viewProjection,
  eyePoint,
  selected,
  enabled,
  buildingBoxes,
}: InjectBuildingPicker) {
  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
    enabled,
    onClick: (ray) => {
      // Ближайшее здание вдоль луча (по расстоянию до входа в его AABB - axis-aligned bounding box)
      const nearest = nearestBuildingHit({ buildingBoxes, ray })?.building ?? null;
      selected.set(nearest); // мимо зданий => снять выделение
    },
  });
}
