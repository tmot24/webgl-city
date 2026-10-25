import { afterNextRender, DestroyRef, ElementRef, inject, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { Ray } from '@webgl-city/core/ray/screen-point-to-ray';
import { bindCanvasPointer } from '@webgl-city/core/interaction/bind-canvas-pointer';

interface InjectCanvasPointer {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  enabled: Signal<boolean>;
  // валидный клик (не перетаскивание) => строит луч; пересечение - дело фичи
  onClick: (ray: Ray) => void;
  // движение указателя => луч (для отслеживания курсора)
  onMove?: (ray: Ray) => void;
}

/**
 * Angular-адаптер над bindCanvasPointer: сигналы камеры читаются в момент события.
 * */
export function injectCanvasPointer({
  canvasRef,
  viewProjection,
  eyePoint,
  enabled,
  onClick,
  onMove,
}: InjectCanvasPointer) {
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    const unbind = bindCanvasPointer({
      canvas: canvasRef().nativeElement,
      getCamera: () => ({ viewProjection: viewProjection(), eye: eyePoint() }),
      isEnabled: enabled,
      onClick,
      onMove,
    });
    destroyRef.onDestroy(unbind);
  });
}
