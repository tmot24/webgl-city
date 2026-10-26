import { RefObject, useLayoutEffect } from 'react';
import { SceneViewport } from './scene-viewport';
import { observeCanvasSize } from '@webgl-city/core/dom/observe-canvas-size';

interface UseCanvasSize {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  viewport: SceneViewport;
}

// Размер буфера рисования => viewport. useLayoutEffect: первый замер до отрисовки, без мерцания
export function useCanvasSize({ canvasRef, viewport }: UseCanvasSize) {
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return observeCanvasSize({ canvas, onResize: viewport.setSize });
  }, [canvasRef, viewport.setSize]);
}
