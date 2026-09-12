import { afterNextRender, DestroyRef, ElementRef, inject, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { Ray, screenPointToRay } from '../shared/ray/screen-point-to-ray';
import { CLICK_MOVE_THRESHOLD } from '../shared/constants';

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
    const canvas = canvasRef().nativeElement;
    let downX = 0;
    let downY = 0;

    const rayForm = (event: PointerEvent): Ray | null => {
      const rect = canvas.getBoundingClientRect();
      return screenPointToRay({ event, rect, viewProjection: viewProjection(), eyePoint: eyePoint() });
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return; // только ЛКМ
      downX = event.clientX;
      downY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (!enabled()) return;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > CLICK_MOVE_THRESHOLD) return;

      const ray = rayForm(event);
      if (ray) onClick(ray);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!enabled()) return;
      const ray = rayForm(event);
      if (ray) onMove?.(ray);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    if (onMove) canvas.addEventListener('pointermove', onPointerMove);
    destroyRef.onDestroy(() => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      if (onMove) canvas.removeEventListener('pointermove', onPointerMove);
    });
  });
}
