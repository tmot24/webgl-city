import { computed, inject, Signal } from '@angular/core';
import { ScreenPoint } from '@webgl-city/core/ray/world-to-screen';
import { MeasureStore } from './measure.store';
import { SceneViewport } from '../../render/scene-viewport';
import { MeasureLabelData, toMeasureLabel } from '@webgl-city/core/measure/measurement';

export interface MeasureOverlay {
  label: Signal<MeasureLabelData | null>;
  snapMarker: Signal<ScreenPoint | null>;
}

/**
 * Экранные проекции измерения (подпись длины, маркер залипания).
 * Не в сторе: зависят от камеры и размера canvas - это слой представления, а не состояния
 * */
export function injectMeasureOverlay(): MeasureOverlay {
  const store = inject(MeasureStore);
  const viewport = inject(SceneViewport);

  const label = computed((): MeasureLabelData | null => {
    const segment = store.segment();
    const project = viewport.project();

    return segment && project ? toMeasureLabel({ segment, project }) : null;
  });

  const snapMarker = computed(() => {
    const point = store.snapPoint();
    const project = viewport.project();

    return point && project ? project({ point }) : null;
  });

  return { label, snapMarker };
}
