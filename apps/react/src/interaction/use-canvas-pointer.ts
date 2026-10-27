import { SceneViewport } from '../render/scene-viewport';
import { Ray } from '@webgl-city/core/ray/screen-point-to-ray';
import { useEffect, useEffectEvent } from 'react';
import { bindCanvasPointer } from '@webgl-city/core/interaction/bind-canvas-pointer';

interface UseCanvasPointer {
  viewport: SceneViewport;
  // выключено => события игнорируются (читается в момент события)
  isEnabled: () => boolean;
  // валидный клик ЛКМ (не перетаскивание) => луч
  onClick: (ray: Ray) => void;
  // движение указателя => луч
  onMove?: (ray: Ray) => void;
}

/**
 * React-адаптер над bindCanvasPointer: canvas и камера - из viewport, читаются в момент события.
 * Callback - через useEffectEvent: всегда свежие, но слушатели не перевешиваются на каждый рендер.
 * */
export function useCanvasPointer({ viewport, isEnabled, onClick, onMove }: UseCanvasPointer) {
  const checkEnabled = useEffectEvent(() => isEnabled());
  const handleClick = useEffectEvent((ray: Ray) => onClick(ray));
  const handleMove = useEffectEvent((ray: Ray) => onMove?.(ray));
  // есть ли onMove вообще - от этого зависит, вешать ли pointermove
  const hasMove = onMove !== undefined;

  useEffect(() => {
    const { canvas } = viewport;
    if (!canvas) return;

    return bindCanvasPointer({
      canvas,
      getCamera: () => ({
        viewProjection: viewport.viewProjection,
        eye: viewport.camera.eye,
      }),
      isEnabled: checkEnabled,
      onClick: handleClick,
      onMove: hasMove ? handleMove : undefined,
    });
  }, [hasMove, viewport]);
}
