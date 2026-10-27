import { afterNextRender, DestroyRef, ElementRef, inject, signal, Signal } from '@angular/core';
import { CanvasSize, observeCanvasSize } from '@webgl-city/core/dom/observe-canvas-size';

/**
 * Angular-адаптер над observeCanvasSize: размер буфера рисования как сигнал.
 */
export function injectCanvasSize({
  canvasRef,
}: {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
}): Signal<CanvasSize> {
  // Размер буфера рисования (стандартный 300 на 150) в device-пикселях;
  // equal: новый объект с теми же числами - не изменение, подписчики не будятся
  const size = signal<CanvasSize>(
    { width: 300, height: 150 },
    { equal: (a, b) => a.width === b.width && a.height === b.height },
  );
  const destroyRef = inject(DestroyRef);

  // Один раз. useEffect с пустыми зависимостями []
  afterNextRender({
    // earlyRead идёт до фазы write — меряем до первой отрисовки, без мерцания
    earlyRead: () => {
      const stop = observeCanvasSize({
        canvas: canvasRef().nativeElement,
        onResize: (next) => size.set(next),
      });
      destroyRef.onDestroy(stop);
    },
  });

  return size.asReadonly();
}
