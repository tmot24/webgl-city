import { inject } from '@angular/core';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { Ray } from '@webgl-city/core/ray/screen-point-to-ray';
import { MeasureStore } from './measure.store';
import { SceneModStore } from '../mode/scene-mod.store';
import { createMeasurePicker } from '@webgl-city/core/measure/create-measure-picker';
import { SceneViewport } from '../../render/scene-viewport';
import { CITY_SCENE } from '../../app/scene/city-scene.token';

/**
 * Режим измерения: клик ставит точку, движение показывает прилипание под курсором.
 * */
export function injectMeasure() {
  const store = inject(MeasureStore);
  const viewport = inject(SceneViewport);
  const { buildingBoxes, city, groundBounds } = inject(CITY_SCENE);
  const picker = createMeasurePicker({ buildingBoxes, road: city.road, groundBounds });

  const resolvePoint = (ray: Ray) => {
    const canvas = viewport.canvas();
    return picker.resolve({
      ray,
      viewProjection: viewport.viewProjection(),
      width: canvas.width,
      height: canvas.height,
    });
  };

  injectCanvasPointer({
    enabled: inject(SceneModStore).is.measure,
    onClick: (ray) => {
      const resolved = resolvePoint(ray);
      if (!resolved) return; // клик в небо
      store.placePoint({ point: resolved.point });
    },
    onMove: (ray) => {
      store.hover({ hit: resolvePoint(ray) });
    },
  });
}
