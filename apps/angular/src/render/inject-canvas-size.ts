import { afterNextRender, DestroyRef, ElementRef, inject, signal, Signal } from '@angular/core';

export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Следит за реальным размером canvas и отдаёт размер буфера рисования
 * в физических пикселях. По возможности использует devicePixelContentBoxSize
 * (точные device-пиксели без ошибок округления на дробном dpr).
 */
export function injectCanvasSize({
  canvasRef,
}: {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
}): Signal<CanvasSize> {
  // Размер буфера рисования (стандартный 300 на 150) в device-пикселях
  const size = signal<CanvasSize>({ width: 300, height: 150 });
  const destroyRef = inject(DestroyRef);

  const setSize = ({ width, height }: CanvasSize) => {
    size.set({
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    });
  };

  // Один раз. useEffect с пустыми зависимостями []
  afterNextRender({
    // earlyRead идёт до фазы write — меряем до первой отрисовки, без мерцания
    earlyRead: () => {
      const element = canvasRef().nativeElement;

      // Синхронный первый замер: приближённо (clientWidth × dpr), чтобы не было большого скачка размера.
      // Обсервер тут же уточнит до точных пикселей.
      const dpr = window.devicePixelRatio || 1;
      setSize({
        width: element.clientWidth * dpr,
        height: element.clientHeight * dpr,
      });

      const observer = new ResizeObserver(([entry]) => {
        if (entry.devicePixelContentBoxSize?.[0]) {
          // Точные физические пиксели — лучший вариант
          const box = entry.devicePixelContentBoxSize[0];
          setSize({
            width: box.inlineSize,
            height: box.blockSize,
          });
        } else if (entry.contentBoxSize?.[0]) {
          // Фолбэк: CSS-пиксели × dpr
          const box = entry.contentBoxSize[0];
          const ratio = window.devicePixelRatio || 1;
          setSize({
            width: box.inlineSize * ratio,
            height: box.blockSize * ratio,
          });
        } else {
          // Самый старый фолбэк
          const ratio = window.devicePixelRatio || 1;
          setSize({
            width: entry.contentRect.width * ratio,
            height: entry.contentRect.height * ratio,
          });
        }
      });

      // 'device-pixel-content-box' поддерживается как опция observe не везде —
      // в старых браузерах конструкция бросит исключение, тогда падаем на content-box
      try {
        observer.observe(element, { box: 'device-pixel-content-box' });
      } catch {
        observer.observe(element, { box: 'content-box' });
      }

      destroyRef.onDestroy(() => observer.disconnect());
    },
  });

  return size.asReadonly();
}
