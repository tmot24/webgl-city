import { afterNextRender, DestroyRef, ElementRef, inject, Signal, WritableSignal } from '@angular/core';
import { Building } from '../city/generate-city.types';
import { mat4, vec3 } from 'gl-matrix';
import { cssToNdc } from '../helper/hit-box/css-to-ndc';
import { ndcToWorld } from '../helper/hit-box/ndc-to-world';
import { rayBoxDistance } from '../helper/hit-box/ray-box-distance';

interface InjectBuildingPicker {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildings: Building[];
  // матрица камеры (функция - читает текущее состояние камеры)
  viewProjection: () => mat4;
  // позиция камеры - начало луча выбора
  eyePoint: Signal<vec3>;
  // куда писать выбор
  selected: WritableSignal<Building | null>;
}

const CLICK_MOVE_THRESHOLD = 6; // px: дальше - это перетаскивание (пан/орбита), а не клик

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
}: InjectBuildingPicker) {
  const destroyRef = inject(DestroyRef);

  const pick = (event: PointerEvent) => {
    const canvas = canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const { ndcX, ndcY } = cssToNdc({ event, rect });

    // Луч: из камеры (eyePoint) через точку на дальнейшей плоскости (ndcZ = 1)
    const inverseVP = mat4.invert(mat4.create(), viewProjection());
    if (!inverseVP) return;
    const far = ndcToWorld({ ndcX, ndcY, ndcZ: 1, inverseVP });
    const origin = eyePoint();
    const dir = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), far, origin));

    // Ближайшее здание вдоль луча (по расстоянию до входа в его AABB - axis-aligned bounding box)
    let nearest: Building | null = null;
    let nearestT = Infinity;
    for (const build of buildings) {
      const boxMin = vec3.fromValues(build.cx - build.width / 2, 0, build.cz - build.depth / 2);
      const boxMax = vec3.fromValues(build.cx + build.width / 2, build.height, build.cz + build.depth / 2);
      const t = rayBoxDistance({ origin, dir, boxMax, boxMin });
      if (t !== null && t < nearestT) {
        nearestT = t;
        nearest = build;
      }
      selected.set(nearest); // мимо зданий => снять выделение
    }
  };

  afterNextRender({
    write: () => {
      const canvas = canvasRef().nativeElement;
      let downX = 0;
      let downY = 0;

      const onDown = (event: PointerEvent) => {
        if (event.button !== 0) return; // только ЛКМ
        downX = event.clientX;
        downY = event.clientY;
      };
      const onUp = (event: PointerEvent) => {
        if (event.button !== 0) return;
        // Мышь уехала => это был пан/перетаскивание, а не клик по зданию
        if (Math.hypot(event.clientX - downX, event.clientY - downY) > CLICK_MOVE_THRESHOLD) return;
        pick(event);
      };

      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointerup', onUp);
      destroyRef.onDestroy(() => {
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerup', onUp);
      });
    },
  });
}
