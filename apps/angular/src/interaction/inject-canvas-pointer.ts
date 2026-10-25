import { afterNextRender, DestroyRef, inject, Signal } from '@angular/core';
import { Ray } from '@webgl-city/core/ray/screen-point-to-ray';
import { bindCanvasPointer } from '@webgl-city/core/interaction/bind-canvas-pointer';
import { SceneViewport } from '../render/scene-viewport';

interface InjectCanvasPointer {
  enabled: Signal<boolean>;
  // валидный клик (не перетаскивание) => строит луч; пересечение - дело фичи
  onClick: (ray: Ray) => void;
  // движение указателя => луч (для отслеживания курсора)
  onMove?: (ray: Ray) => void;
}

/**
 * Angular-адаптер над bindCanvasPointer: canvas и камера - из SceneViewport,
 * читаются в момент события.
 * */
export function injectCanvasPointer({ enabled, onClick, onMove }: InjectCanvasPointer) {
  const destroyRef = inject(DestroyRef);
  const viewport = inject(SceneViewport);

  afterNextRender(() => {
    const unbind = bindCanvasPointer({
      canvas: viewport.canvas(),
      getCamera: () => ({ viewProjection: viewport.viewProjection(), eye: viewport.eyePoint() }),
      isEnabled: enabled,
      onClick,
      onMove,
    });
    destroyRef.onDestroy(unbind);
  });
}
