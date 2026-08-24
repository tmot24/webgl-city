import {
  afterNextRender,
  afterRenderEffect,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { InstanceData } from '../helper/city/build-instance-data';
import { vec3 } from 'gl-matrix';
import {
  BUILDING_ATTRIBUTES_LOCATION,
  BuildingMaterial,
  createBuildingMaterial,
} from '../helper/material/building-material/building-material';
import { injectCanvasSize } from './inject-canvas-size';
import { injectOrbitCamera } from './inject-orbit-camera';
import { createViewProjectionMatrix } from '../helper/matrix/create-view-projection-matrix';
import { constructCubeGeometry } from '../helper/geometry/construct-cube-geometry';
import { createProgram } from '../helper/core/create-program';
import buildingVertex from '../helper/material/building-material/building-material.vert';
import buildingFragment from '../helper/material/building-material/building-material.frag';
import { createVAO } from '../helper/mesh/create-vao';

interface InjectCityRender {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  instanceData: InstanceData;
  // направление НА свет (нормализованное)
  lightDirection?: WritableSignal<vec3>;
}

// Всё, что готовится один раз в afterNextRender и нужно каждый кадр
interface Prepared {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  material: BuildingMaterial;
}

export function injectCityRender({
  canvasRef,
  instanceData,
  // солнце сверху-сбоку по умолчанию (направление НА свет), нормализуем
  lightDirection = signal(vec3.normalize(vec3.create(), vec3.fromValues(0.6, 1.0, 0.4))),
}: InjectCityRender) {
  const size = injectCanvasSize({ canvasRef });
  const destroyRef = inject(DestroyRef);

  // Камера под масштаб города (~1450 м): initialEye задаёт радиус (~2780 м) и 3/4-ракурс сверху
  const { viewMatrix } = injectOrbitCamera({
    canvasRef,
    initialEye: vec3.fromValues(1500, 1800, 1500),
  });
  // near/far под масштаб города: ближайшее здание дальше ~1700 м, поэтому near можно поднять - меньше z-fighting
  const viewProjection = createViewProjectionMatrix({ canvasRef, viewMatrix, near: 10, far: 6000 });

  const geometry = constructCubeGeometry();

  let gl: WebGL2RenderingContext | null = null;
  let prepared: Prepared | null = null;

  // ОДИН РАЗ: контекст, программа, VAO (куб + экземпляр-атрибуты), материал
  afterNextRender({
    write: () => {
      const context = canvasRef().nativeElement.getContext('webgl2');
      if (!context) throw new Error('WebGL2 не поддерживается этим браузером');
      gl = context;

      context.enable(context.DEPTH_TEST);
      context.clearColor(0.53, 0.7, 0.87, 1); // небесный фон

      const program = createProgram({ gl: context, vertex: buildingVertex, fragment: buildingFragment });
      const { vao, buffers, indexBuffer } = createVAO({
        gl: context,
        attributes: [
          {
            // per-vertex (из геометрии куба)
            location: BUILDING_ATTRIBUTES_LOCATION.position,
            srcData: geometry.position,
            size: 3,
          },
          {
            location: BUILDING_ATTRIBUTES_LOCATION.normal,
            srcData: geometry.normal,
            size: 3,
          },
          {
            // per-instance (одно значение на здание): divisor: 1. Два плотных массива => stride 0
            location: BUILDING_ATTRIBUTES_LOCATION.translation,
            srcData: instanceData.translations,
            size: 3,
            divisor: 1,
          },
          {
            location: BUILDING_ATTRIBUTES_LOCATION.scale,
            srcData: instanceData.scales,
            size: 3,
            divisor: 1,
          },
        ],
        indices: {
          srcData: geometry.indices,
        },
      });

      context.useProgram(program); // до кэширования/установки uniform
      const material = createBuildingMaterial({
        gl: context,
        program,
      });

      prepared = { program, vao, material };

      destroyRef.onDestroy(() => {
        buffers.forEach((buffer) => context.deleteBuffer(buffer));
        if (indexBuffer) context.deleteBuffer(indexBuffer);
        context.deleteVertexArray(vao);
        context.deleteProgram(program);
      });

      render(); // первый кадр сразу, без ожидания ресайза
    },
  });

  afterRenderEffect({
    write: () => render(),
  });

  function render() {
    if (!gl || !prepared) return;

    const { width, height } = size();
    const canvas = canvasRef().nativeElement;
    // трогаем буфер только при реальном изменении размера
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(prepared.program);
    gl.bindVertexArray(prepared.vao);

    prepared.material.updatePerFrame({
      // читает viewMatrix() => реакция на вращение камеры
      viewProjection: viewProjection(),
      // читает сигнал солнца => реакция на смену направления
      lightDirection: lightDirection(),
    });

    // Один вызов на весь город: 36 индексов куба * instanceData.count зданий
    gl.drawElementsInstanced(gl.TRIANGLES, geometry.count, gl.UNSIGNED_SHORT, 0, instanceData.count);

    // Чтобы посторонние данные не попали в vao
    gl.bindVertexArray(null);
  }

  return { lightDirection };
}
