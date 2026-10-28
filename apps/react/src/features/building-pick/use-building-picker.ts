import { CityScene } from '@webgl-city/core/city/build-city-scene';
import { SceneViewport } from '../../render/scene-viewport';
import { SceneStore } from '../../store/scene.store';
import { useCanvasPointer } from '../../interaction/use-canvas-pointer';
import { nearestBuildingHit } from '@webgl-city/core/city/nearest-building-hit';

interface UseBuildingPicker {
  cityScene: CityScene;
  viewport: SceneViewport;
  store: SceneStore;
}

/**
 * Выбор зданий: клик ЛКМ => луч из камеры через точку клика => ближайшее задетое здание.
 * Клик мимо снимает выделение.
 * */
export function useBuildingPicker({ cityScene, viewport, store }: UseBuildingPicker) {
  useCanvasPointer({
    viewport,
    isEnabled: () => store.mode.isBuilding,
    onClick: (ray) => {
      // Ближайшее здание вдоль луча (по расстоянию до входа в его AABB)
      const building = nearestBuildingHit({ buildingBoxes: cityScene.buildingBoxes, ray })?.building ?? null;
      store.building.pick({ building });
    },
  });
}
