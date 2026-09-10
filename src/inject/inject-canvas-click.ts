import { afterNextRender, DestroyRef, ElementRef, inject, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { Ray, screenPointToRay } from '../helper/hit-box/screen-point-to-ray';
import { CLICK_MOVE_THRESHOLD } from '../helper/constants';

interface InjectCanvasClick {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  enabled: Signal<boolean>;
  // валидный клик (не перетаскивание) => строит луч; пересечение - дело фичи
  onClick: (ray: Ray) => void;
}

export function injectCanvasClick({ canvasRef, viewProjection, eyePoint, enabled, onClick }: InjectCanvasClick) {
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
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
      if (!enabled()) return;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > CLICK_MOVE_THRESHOLD) return;

      const rect = canvas.getBoundingClientRect();
      const ray = screenPointToRay({ event, rect, viewProjection: viewProjection(), eyePoint: eyePoint() });
      if (ray) onClick(ray);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    destroyRef.onDestroy(() => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
    });
  });
}
