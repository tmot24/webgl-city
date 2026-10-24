import { computed, inject, Signal } from '@angular/core';
import { vec3 } from 'gl-matrix';
import { MeasureLabelData } from './measure-label/measure-label';
import { ScreenPoint } from '../../shared/ray/world-to-screen';
import { MeasureStore } from './measure.store';
import { SceneViewport } from '../../render/scene-viewport';

export interface MeasureOverlay {
  label: Signal<MeasureLabelData | null>;
  snapMarker: Signal<ScreenPoint | null>;
}

/**
 * Экранные проекции измерения (подпись длины, маркер залипания).
 * Не в сторе: зависят от камеры и размера canvas - это слой представления, а не состояния
 * */
export function injectMeasureOverlay() {
  const store = inject(MeasureStore);
  const viewport = inject(SceneViewport);

  const label = computed((): MeasureLabelData | null => {
    const segment = store.segment();
    if (!segment) return null;
    const { a, b } = segment;

    const screenPoint = viewport.project({ point: vec3.lerp(vec3.create(), a, b, 0.5) });
    if (!screenPoint) return null;

    return {
      x: screenPoint.x,
      y: screenPoint.y,
      text: `${vec3.distance(a, b).toFixed(2)} м`,
    };
  });

  const snapMarker = computed(() => {
    const point = store.snapPoint();
    return point ? viewport.project({ point }) : null;
  });

  return { label, snapMarker };
}
