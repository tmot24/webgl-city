import { mat4, vec3 } from 'gl-matrix';
import { afterNextRender, DestroyRef, ElementRef, inject, Signal, WritableSignal } from '@angular/core';
import { Building } from '../city/generate-city.types';
import { intersectGround } from '../helper/hit-box/intersect-ground';
import { rayBoxDistance } from '../helper/hit-box/ray-box-distance';
import { cssToNdc } from '../helper/hit-box/css-to-ndc';
import { ndcToWorld } from '../helper/hit-box/ndc-to-world';
import { CLICK_MOVE_THRESHOLD } from '../helper/constants';

export interface Measurement {
  id: number;
  a: vec3; // первая точка (мировые координаты)
  b: vec3; // вторая точка
}

interface InjectMeasure {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  buildings: Building[];
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  // завершённые измерения (пары точек)
  measurements: WritableSignal<Measurement[]>;
  // первая поставленная точка, ждём вторую (null - начинаем новое измерение)
  pending: WritableSignal<vec3 | null>;
  // включён ли режим измерения (Scene выводит из activeMode)
  enabled: Signal<boolean>;
}

export function injectMeasure({
  canvasRef,
  buildings,
  viewProjection,
  eyePoint,
  measurements,
  pending,
  enabled,
}: InjectMeasure) {
  const destroyRef = inject(DestroyRef);
  let nextId = 1;

  // Ближайшая точка на поверхности вдоль луча: земля или AABB здания. null - луч мимо всего (небо)
  const surfacePoint = ({ origin, dir }: { origin: vec3; dir: vec3 }) => {
    let best: vec3 | null = null;
    let bestT = Infinity;

    const ground = intersectGround({ origin, dir });
    if (ground) {
      const t = vec3.distance(origin, ground); // dir - нормализирован => t = расстояние
      if (t < bestT) {
        bestT = t;
        best = ground;
      }
    }

    for (const { cx, cz, height, depth, width } of buildings) {
      const boxMin = vec3.fromValues(cx - width / 2, 0, cz - depth / 2);
      const boxMax = vec3.fromValues(cx + width / 2, height, cz + depth / 2);
      const t = rayBoxDistance({ origin, dir, boxMin, boxMax });
      if (t !== null && t < bestT) {
        bestT = t;
        best = vec3.scaleAndAdd(vec3.create(), origin, dir, t);
      }
    }

    return best;
  };

  const place = (event: PointerEvent) => {
    const canvas = canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const { ndcX, ndcY } = cssToNdc({ event, rect });

    const inverseVP = mat4.invert(mat4.create(), viewProjection());
    if (!inverseVP) return;
    const far = ndcToWorld({ ndcX, ndcY, ndcZ: 1, inverseVP });
    const origin = eyePoint();
    const dir = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), far, origin));

    const point = surfacePoint({ origin, dir });
    if (!point) return; // клик в небо

    const first = pending();
    if (!first) {
      pending.set(point); // первая точка отрезка
    } else {
      measurements.update((list) => [...list, { id: nextId++, a: first, b: point }]);
      pending.set(null); // измерение завершено, следующий клик начнёт новое
    }
  };

  afterNextRender(() => {
    const canvas = canvasRef().nativeElement;
    let downX = 0;
    let downY = 0;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      downX = event.clientX;
      downY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (!enabled()) return;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > CLICK_MOVE_THRESHOLD) return;
      place(event);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    destroyRef.onDestroy(() => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
    });
  });
}
