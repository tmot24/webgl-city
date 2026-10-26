import { inject } from '@angular/core';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { nearestBuildingHit } from '@webgl-city/core/city/nearest-building-hit';
import { BuildingStore } from './building.store';
import { SceneModeStore } from '../mode/scene-mode.store';
import { CITY_SCENE } from '../../app/scene/city-scene.token';

/**
 * Выбор зданий: клик ЛКМ => луч из камеры через точку клика => ближайшее задетое здание.
 * Клик мимо, снимает выделение.
 * */
export function injectBuildingPicker() {
  const store = inject(BuildingStore);
  const { buildingBoxes } = inject(CITY_SCENE);

  injectCanvasPointer({
    enabled: inject(SceneModeStore).is.building,
    onClick: (ray) => {
      // Ближайшее здание вдоль луча (по расстоянию до входа в его AABB - axis-aligned bounding box)
      const building = nearestBuildingHit({ buildingBoxes, ray })?.building ?? null;
      store.pick({ building }); // мимо зданий => снять выделение
    },
  });
}
