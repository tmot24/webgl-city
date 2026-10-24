export interface CanvasSize {
  width: number;
  height: number;
}

interface ObserveCanvasSize {
  canvas: HTMLCanvasElement;
  onResize: (size: CanvasSize) => void;
}

/**
 * Следит за реальным размером canvas и сообщает размер буфера рисования в физических пикселях.
 * По возможности использует devicePixelContentBoxSize (точные device-пиксели без ошибок округления на дробном dpr).
 * Первый замер - синхронно, сразу при вызове. Возвращает функцию отписки.
 * */
export function observeCanvasSize({ canvas, onResize }: ObserveCanvasSize) {
  const emit = ({ width, height }: CanvasSize) => {
    onResize({
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    });
  };

  // Синхронный первый замер: приближенно (clientWidth * dpr), чтобы не было большого скачка размера.
  // Обсервер тут же уточнит до точных пикселей.
  const dpr = window.devicePixelRatio || 1;
  emit({
    width: canvas.clientWidth * dpr,
    height: canvas.clientHeight * dpr,
  });

  /**
   * ResizeObserver вызывает колбэк при каждом изменении размера элемента (окно, layout, смена dpr) - дешевле и точнее, чем слушать window.resize
   * */
  const observer = new ResizeObserver(([entry]) => {
    if (entry.devicePixelContentBoxSize?.[0]) {
      // Точные физические пиксели - лучший вариант
      const box = entry.devicePixelContentBoxSize[0];
      emit({
        width: box.inlineSize,
        height: box.blockSize,
      });
    } else if (entry.contentBoxSize?.[0]) {
      // Фолбэк: css-пиксели * dpr
      const box = entry.contentBoxSize[0];
      const ratio = window.devicePixelRatio || 1;
      emit({
        width: box.inlineSize * ratio,
        height: box.blockSize * ratio,
      });
    } else {
      // Самый старый фолбэк
      const ratio = window.devicePixelRatio || 1;
      emit({
        width: entry.contentRect.width * ratio,
        height: entry.contentRect.height * ratio,
      });
    }
  });

  try {
    observer.observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    observer.observe(canvas, { box: 'content-box' });
  }

  return () => observer.disconnect();
}
