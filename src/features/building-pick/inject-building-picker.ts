import { ElementRef, Signal, WritableSignal } from '@angular/core';
import { Building } from '../../city/generate-city.types';
import { mat4, vec3 } from 'gl-matrix';
import { rayBoxDistance } from '../../shared/ray/ray-box-distance';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';

interface InjectBuildingPicker {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildings: Building[];
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
  buildings,
  viewProjection,
  eyePoint,
  selected,
  enabled,
}: InjectBuildingPicker) {
  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
    enabled,
    onClick: ({ origin, dir }) => {
      // Ближайшее здание вдоль луча (по расстоянию до входа в его AABB - axis-aligned bounding box)
      let nearest: Building | null = null;
      let nearestT = Infinity;
      for (const build of buildings) {
        const boxMin = vec3.fromValues(build.cx - build.width / 2, 0, build.cz - build.depth / 2);
        const boxMax = vec3.fromValues(build.cx + build.width / 2, build.height, build.cz + build.depth / 2);
        const t = rayBoxDistance({ origin, dir, boxMin, boxMax });
        if (t !== null && t < nearestT) {
          nearestT = t;
          nearest = build;
        }
      }
      selected.set(nearest); // мимо зданий => снять выделение
    },
  });
}
