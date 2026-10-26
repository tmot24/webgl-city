import { useRef, useState } from 'react';
import { buildCityScene } from '@webgl-city/core/city/build-city-scene';
import { SceneViewport } from '../../render/scene-viewport';
import { SceneStore } from '../../store/scene.store';
import { ControlHint } from '../control-hint/control-hint';
import { useCanvasSize } from '../../render/use-canvas-size';
import { useOrbitControls } from '../../camera/use-orbit-controls';
import { useCityRender } from '../../render/use-city-render';

export function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Один раз на экземпляр сцены
  const [cityScene] = useState(buildCityScene);
  const [viewport] = useState(() => new SceneViewport());
  const [store] = useState(() => new SceneStore());

  useCanvasSize({ canvasRef, viewport });
  useCityRender({ canvasRef, cityScene, viewport, store });
  useOrbitControls({ canvasRef, camera: viewport.camera });

  return (
    <div className="scene">
      <canvas ref={canvasRef} className="scene__canvas" />
      <div className="scene__overlay">
        <ControlHint />
      </div>
    </div>
  );
}
