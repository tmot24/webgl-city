import { mat4, vec3 } from 'gl-matrix';
import { ElementRef, inject, Signal } from '@angular/core';
import { RoadGrid } from '@webgl-city/core/city/generate-city.types';
import { GroundBounds } from '@webgl-city/core/ray/intersect-ground';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { Ray } from '@webgl-city/core/ray/screen-point-to-ray';
import { BuildingBox } from '@webgl-city/core/city/building-box';
import { MeasureStore } from './measure.store';
import { SceneModStore } from '../mode/scene-mod.store';
import { createMeasurePicker } from '@webgl-city/core/measure/create-measure-picker';

interface InjectMeasure {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildingBoxes: BuildingBox[];
  road: RoadGrid;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  // Прямоугольник земли
  groundBounds: GroundBounds;
}

/**
 * Режим измерения: клик ставит точку, движение показывает прилипание под курсором.
 * */
export function injectMeasure({
  canvasRef,
  buildingBoxes,
  road,
  viewProjection,
  eyePoint,
  groundBounds,
}: InjectMeasure) {
  const store = inject(MeasureStore);
  const picker = createMeasurePicker({ buildingBoxes, road, groundBounds });

  const resolvePoint = (ray: Ray) => {
    const canvas = canvasRef().nativeElement;
    return picker.resolve({
      ray,
      viewProjection: viewProjection(),
      width: canvas.width,
      height: canvas.height,
    });
  };

  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
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
