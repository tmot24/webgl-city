import { useSceneStore } from '../../../store/scene-store.context';
import { useSceneViewport } from '../../../render/scene-viewport.context';
import { toMeasureLabel } from '@webgl-city/core/measure/measurement';
import { useRef } from 'react';
import { useScreenOverlay } from '../../../render/use-screen-overlay';

/**
 * Подпись длины над серединой отрезка. React рендерит элемент один раз;
 * текст, позицию и видимость обновляет useScreenOverlay/
 * */
export function MeasureLabel() {
  const ref = useRef<HTMLDivElement>(null);
  const { measure } = useSceneStore();
  const viewport = useSceneViewport();

  useScreenOverlay({
    ref,
    read: () => {
      const { segment } = measure;
      const project = viewport.projector;
      return segment && project ? toMeasureLabel({ segment, project }) : null;
    },
  });

  return <div ref={ref} className="measure-label" hidden />;
}
