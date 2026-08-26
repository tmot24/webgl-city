import { afterNextRender, afterRenderEffect, DestroyRef, ElementRef, inject, Signal } from '@angular/core';
import { InstanceData } from '../city/build-instance-data';
import { vec3 } from 'gl-matrix';
import { injectCanvasSize } from './inject-canvas-size';
import { injectOrbitCamera } from './inject-orbit-camera';
import { createViewProjectionMatrix } from '../helper/matrix/create-view-projection-matrix';
import { BuildingRenderer, createBuildingRenderer } from '../helper/render/create-building-renderer';
import { createSurfaceRenderer, SurfaceRenderer } from '../helper/render/create-surface-renderer';
import { FlatGeometry } from '../road/build-road-geometry';

interface InjectCityRender {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  instanceData: InstanceData;
  ground: {
    groundGeometry: FlatGeometry;
    groundColor: vec3;
  };
  road: {
    roadGeometry: FlatGeometry;
    roadColor: vec3;
  };
  // направление НА свет (нормализованное)
  lightDirection: Signal<vec3>;
}

export function injectCityRender({
  canvasRef,
  instanceData,
  ground: { groundGeometry, groundColor },
  road: { roadGeometry, roadColor },
  // солнце сверху-сбоку по умолчанию (направление НА свет), нормализуем
  lightDirection,
}: InjectCityRender) {
  const size = injectCanvasSize({ canvasRef });
  const destroyRef = inject(DestroyRef);

  // Камера под масштаб города (~1450 м): initialEye задаёт радиус (~2780 м) и 3/4-ракурс сверху
  const { viewMatrix } = injectOrbitCamera({
    canvasRef,
    initialEye: vec3.fromValues(1500, 1800, 1500),
  });
  // near/far под масштаб города: ближайшее здание дальше ~1700 м, поэтому near можно поднять - меньше z-fighting
  const viewProjection = createViewProjectionMatrix({ canvasRef, viewMatrix, near: 10, far: 10000 });

  let gl: WebGL2RenderingContext | null = null;
  let buildings: BuildingRenderer | null = null;
  let surface: SurfaceRenderer | null = null;

  // ОДИН РАЗ: контекст, программа, VAO (куб + экземпляр-атрибуты), материал
  afterNextRender({
    write: () => {
      const context = canvasRef().nativeElement.getContext('webgl2');
      if (!context) throw new Error('WebGL2 не поддерживается этим браузером');
      gl = context;

      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.53, 0.7, 0.87, 1); // небесный фон

      buildings = createBuildingRenderer({ gl, instanceData });
      surface = createSurfaceRenderer({
        gl,
        surfaces: [
          {
            geometry: groundGeometry,
            color: groundColor,
          },
          {
            geometry: roadGeometry,
            color: roadColor,
          },
        ],
      });

      destroyRef.onDestroy(() => {
        buildings?.dispose();
        surface?.dispose();
      });

      render(); // первый кадр сразу
    },
  });

  // Реактивно: перерисовка при изменении размера, вращении, направления света
  afterRenderEffect({
    write: () => render(),
  });

  function render() {
    if (!gl || !buildings || !surface) return;

    const { width, height } = size();
    const canvas = canvasRef().nativeElement;
    // трогаем буфер только при реальном изменении размера
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const camera = viewProjection();
    const light = lightDirection();

    buildings.draw({ viewProjection: camera, lightDirection: light });
    surface.draw({ viewProjection: camera });
  }

  return { lightDirection };
}
