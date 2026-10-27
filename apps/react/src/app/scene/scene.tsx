import { useRef, useState } from 'react';
import { buildCityScene } from '@webgl-city/core/city/build-city-scene';
import { SceneViewport } from '../../render/scene-viewport';
import { SceneStore } from '../../store/scene.store';
import { ControlHint } from '../control-hint/control-hint';
import { useViewportCanvas } from '../../render/use-viewport-canvas';
import { useOrbitControls } from '../../camera/use-orbit-controls';
import { useCityRender } from '../../render/use-city-render';
import { SceneStoreContext } from '../../store/scene-store.context';
import { ModeHint } from '../../features/mode/mode-hint/mode-hint';
import { ModeToolbar } from '../../features/mode/mode-toolbar/mode-toolbar';
import { SceneViewportContext } from '../../render/scene-viewport.context';
import { useBuildingPicker } from '../../features/building-pick/use-building-picker';
import { useMeasure } from '../../features/measure/use-measure';
import { useRoute } from '../../features/route/use-route';
import { useEscapeKey } from '../../interaction/use-escape-key';

export function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Один раз на экземпляр сцены
  const [cityScene] = useState(buildCityScene);
  const [viewport] = useState(() => new SceneViewport());
  const [store] = useState(() => new SceneStore());

  // Canvas, render и камера
  useViewportCanvas({ canvasRef, viewport });
  useCityRender({ canvasRef, cityScene, viewport, store });
  useOrbitControls({ canvasRef, camera: viewport.camera });

  // Фичи: клики и движение по сцене
  useBuildingPicker({ cityScene, viewport, store });
  useMeasure({ cityScene, viewport, store });
  useRoute({ cityScene, viewport, store });

  // Esc сбрасывает текущее действие активного режима
  useEscapeKey({ onEscape: store.cancelActiveAction });

  return (
    <SceneViewportContext value={viewport}>
      <SceneStoreContext value={store}>
        <div className="scene">
          <canvas ref={canvasRef} className="scene__canvas" />
          <div className="scene__overlay">
            <ControlHint />
            <ModeToolbar />
            <ModeHint />
          </div>
        </div>
      </SceneStoreContext>
    </SceneViewportContext>
  );
}
