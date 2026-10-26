import { RefObject, useEffect } from 'react';
import { OrbitCamera } from './orbit-camera';
import { bindOrbitControls } from '@webgl-city/core/camera/bind-orbit-controls';

interface UseOrbitControls {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  camera: OrbitCamera;
}

export function useOrbitControls({ canvasRef, camera }: UseOrbitControls) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return bindOrbitControls({
      canvas,
      onRotate: camera.rotate,
      onPan: camera.pan,
      onZoom: camera.zoom,
    });
  }, [camera, canvasRef]);
}
