import { RefObject, useLayoutEffect } from 'react';
import { SceneViewport } from './scene-viewport';
import { observeCanvasSize } from '@webgl-city/core/dom/observe-canvas-size';

interface UseViewportCanvas {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  viewport: SceneViewport;
}

/**
 * Подключает canvas к viewport: ссылка на элемент + размер буфера рисования.
 * useLayoutEffect: первый замер до отрисовки, без мерцания.
 * */
export function useViewportCanvas({ canvasRef, viewport }: UseViewportCanvas) {
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    viewport.attachCanvas({ canvas });
    const stopObserving = observeCanvasSize({ canvas, onResize: viewport.setSize });

    return () => {
      stopObserving();
      viewport.attachCanvas({ canvas: null });
    };
  }, [canvasRef, viewport]);
}
