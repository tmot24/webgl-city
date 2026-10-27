import { useSceneStore } from '../../../store/scene-store.context';
import { useSceneViewport } from '../../../render/scene-viewport.context';
import { useRef } from 'react';
import { useScreenOverlay } from '../../../render/use-screen-overlay';

/**
 * Маркер залипания: кружок в точке, к которой прилипнет клик.
 * React рендерит элемент один раз; позицию и видимость обновляет useScreenOverlay.
 * */
export function SnapMarker() {
  const ref = useRef<HTMLDivElement>(null);
  const { measure } = useSceneStore();
  const viewport = useSceneViewport();

  useScreenOverlay({
    ref,
    read: () => {
      const { snapPoint } = measure;
      const project = viewport.projector;
      return snapPoint && project ? project({ point: snapPoint }) : null;
    },
  });

  return <div ref={ref} className="snap-marker" hidden />;
}
