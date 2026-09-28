import { ElementRef, inject, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { nearestBuildingHit } from '../../city/nearest-building-hit';
import { BuildingBox } from '../../city/building-box';
import { BuildingStore } from './building.store';
import { SceneModStore } from '../mode/scene-mod.store';

interface InjectBuildingPicker {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  // коробки зданий (строятся один раз в Scene)
  buildingBoxes: BuildingBox[];
  // матрица камеры (функция - читает текущее состояние камеры)
  viewProjection: () => mat4;
  // позиция камеры - начало луча выбора
  eyePoint: Signal<vec3>;
}

/**
 * Выбор зданий: клик ЛКМ => луч из камеры через точку клика => ближайшее задетое здание.
 * Возвращает сигнал выбранного здания (null - клик мимо, выделение снято).
 * */
export function injectBuildingPicker({ canvasRef, viewProjection, eyePoint, buildingBoxes }: InjectBuildingPicker) {
  const store = inject(BuildingStore);

  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
    enabled: inject(SceneModStore).is.building,
    onClick: (ray) => {
      // Ближайшее здание вдоль луча (по расстоянию до входа в его AABB - axis-aligned bounding box)
      const building = nearestBuildingHit({ buildingBoxes, ray })?.building ?? null;
      store.pick({ building }); // мимо зданий => снять выделение
    },
  });
}
