import { mat4, vec3 } from 'gl-matrix';
import { ElementRef, Signal, WritableSignal } from '@angular/core';
import { Building } from '../city/generate-city.types';
import { GroundBounds, intersectGround } from '../helper/hit-box/intersect-ground';
import { rayBoxDistance } from '../helper/hit-box/ray-box-distance';
import { injectCanvasPointer } from './inject-canvas-pointer';

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
  // точка под курсором на поверхности (null в небе)
  cursorPoint: WritableSignal<vec3 | null>;
  // Прямоугольник земли
  groundBounds: GroundBounds;
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
  cursorPoint,
  groundBounds,
  enabled,
}: InjectMeasure) {
  let nextId = 1;

  // Ближайшая точка на поверхности вдоль луча: земля или AABB здания. null - луч мимо всего (небо)
  const surfacePoint = ({ origin, dir }: { origin: vec3; dir: vec3 }) => {
    let best: vec3 | null = null;
    let bestT = Infinity;

    const ground = intersectGround({ origin, dir, bounds: groundBounds });
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

  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
    enabled,
    onClick: ({ origin, dir }) => {
      const point = surfacePoint({ origin, dir });
      if (!point) return; // клик в небо

      const first = pending();
      if (!first) {
        pending.set(point); // первая точка отрезка
      } else {
        measurements.update((list) => [...list, { id: nextId++, a: first, b: point }]);
        pending.set(null); // измерение завершено, следующий клик начнёт новое
        cursorPoint.set(null); // резинка больше не нужна
      }
    },
    onMove: ({ origin, dir }) => {
      if (!pending()) return; // резинка только между первой и второй точкой
      cursorPoint.set(surfacePoint({ origin, dir })); // null в небе => резинка скрыта
    },
  });
}
