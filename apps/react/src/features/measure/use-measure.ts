import { SceneStore } from '../../store/scene.store';
import { SceneViewport } from '../../render/scene-viewport';
import { CityScene } from '@webgl-city/core/city/build-city-scene';
import { useMemo } from 'react';
import { createMeasurePicker } from '@webgl-city/core/measure/create-measure-picker';
import { Ray } from '@webgl-city/core/ray/screen-point-to-ray';
import { useCanvasPointer } from '../../interaction/use-canvas-pointer';

interface UseMeasure {
  cityScene: CityScene;
  viewport: SceneViewport;
  store: SceneStore;
}

/**
 * Режим измерения: клик ставит точку, движение показывает прилипание под курсором и тянет "резинку".
 * */
export function useMeasure({ cityScene, viewport, store }: UseMeasure) {
  // Производные данные города, как граф в useRoute
  const picker = useMemo(() => {
    return createMeasurePicker({
      buildingBoxes: cityScene.buildingBoxes,
      road: cityScene.city.road,
      groundBounds: cityScene.groundBounds,
    });
  }, [cityScene]);

  // Точка под лучом с учётом прилипания; порог прилипания - в CSS-пикселях canvas
  const resolvePoint = (ray: Ray) => {
    const { canvas } = viewport;
    if (!canvas) return null;

    return picker.resolve({
      ray,
      viewProjection: viewport.viewProjection,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  };

  useCanvasPointer({
    viewport,
    isEnabled: () => store.mode.isMeasure,
    onClick: (ray) => {
      // под useEffectEvent
      const resolved = resolvePoint(ray);
      if (!resolved) return; // клик в небо

      store.measure.placePoint({ point: resolved.point });
    },
    onMove: (ray) => store.measure.hover({ hit: resolvePoint(ray) }),
  });
}
