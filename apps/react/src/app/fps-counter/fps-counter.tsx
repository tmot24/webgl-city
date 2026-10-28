import { useEffect, useState } from 'react';
import { observeFps } from '@webgl-city/core/diagnostics/observe-fps';
import { fpsColor } from '@webgl-city/core/diagnostics/fps-color';

export function FpsCounter() {
  const [fps, setFps] = useState(0);

  // функция остановки из ядра - сразу cleanup эффекта
  useEffect(() => {
    return observeFps({ onSample: ({ fps }) => setFps(fps) });
  }, []);

  return (
    <span className="fps-counter" style={{ color: fpsColor({ fps }) }}>
      {fps}
    </span>
  );
}
