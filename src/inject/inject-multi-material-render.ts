import { Material, MaterialUpdatePerFrame } from '../helper/material/material';
import { mat4 } from 'gl-matrix';
import { afterNextRender, afterRenderEffect, DestroyRef, ElementRef, inject, Signal } from '@angular/core';
import { ConstructCubeGeometry } from '../helper/geometry/construct-cube-geometry';
import { injectCanvasSize } from './inject-canvas-size';
import { createProgram } from '../helper/core/create-program';
import { createDrawable } from '../helper/material/create-drawable';

// Один объект сцены: материал + функция, дающая его матрицу на текущий кадр
interface SceneObject {
  material: Material;
  modelMatrix?: () => mat4; // может читать сигналы (угол, позиция) => реактивно
}

interface InjectMultiMaterialRender {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  geometry: ConstructCubeGeometry;
  objects: SceneObject[];
  // общая матрица камеры+проекция на кадр (view-projection)
  viewProjection: () => mat4;
}

// Внутренне состояние одного подготовленного объекта (создаётся один раз в setup)
interface PreparedObject {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  count: number;
  u_Matrix: WebGLUniformLocation;
  modelMatrix?: () => mat4;
  isReady?: Signal<boolean>;
  updatePerFrame?: MaterialUpdatePerFrame;
}

export function injectMultiMaterialRender({ canvasRef, geometry, objects, viewProjection }: InjectMultiMaterialRender) {
  const size = injectCanvasSize({ canvasRef });
  const destroyRef = inject(DestroyRef);

  let gl: WebGL2RenderingContext | null = null;
  let prepared: PreparedObject[] = [];

  // ОДИН РАЗ: контекст + по каждому материалу своя программа, VAO, uniform-настройка
  afterNextRender({
    write: () => {
      const context = canvasRef().nativeElement.getContext('webgl2');
      if (!context) throw new Error('WebGL2 не поддерживается');
      gl = context;

      gl.enable(gl.DEPTH_TEST); // всё непрозрачное - обычный depth-тест
      gl.clearColor(0, 0, 0, 0.5);

      prepared = objects.map(({ material, modelMatrix }) => {
        // своя программа под шейдеры материала
        const program = createProgram({
          gl: context,
          vertex: material.vertex,
          fragment: material.fragment,
        });

        // VAO под атрибуты, которые объявил материал (берёт нужное из geometry)
        const { vao, buffers, indexBuffer, count } = createDrawable({
          gl: context,
          geometry,
          material,
        });

        // общая матрица-uniform (есть у всех материалов)
        const u_Matrix = context.getUniformLocation(program, 'u_Matrix');
        if (!u_Matrix) throw new Error('uniform u_Matrix не найден');

        // uniform/текстуры конкретного материала (нужно активировать программу перед uniform1i)
        context.useProgram(program);
        const result = material.setup?.({ gl: context, program, destroyRef });

        // очистка ресурсов этого объекта
        destroyRef.onDestroy(() => {
          buffers.forEach((buffer) => context.deleteBuffer(buffer));
          if (indexBuffer) context.deleteBuffer(indexBuffer);
          context.deleteVertexArray(vao);
          context.deleteProgram(program);
        });

        return {
          program,
          vao,
          count,
          u_Matrix,
          modelMatrix,
          isReady: result?.isReady,
        };
      });
    },
  });

  // РЕАКТИВНО: кадр - проходим по подготовленным объектам
  afterRenderEffect({
    write: () => {
      const { width, height } = size();
      if (!gl) return;

      const canvas = canvasRef().nativeElement;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      // Читаем сигналы готовности БЕЗУСЛОВНО (до отрисовки), чтобы подписка на них
      // установилась всегда — даже если ниже появится пропуск объектов (continue).
      for (const { isReady } of prepared) {
        isReady?.();
      }

      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const viewProjectionMatrix = viewProjection(); // общая на кадр

      for (const { program, vao, count, u_Matrix, modelMatrix, updatePerFrame } of prepared) {
        gl.useProgram(program); // активируем программу ПЕРЕД любым uniform
        gl.bindVertexArray(vao); // его VAO

        const model = modelMatrix?.() ?? mat4.create();
        // итоговая матрица = viewProjection * model этого объекта
        const uMatrix = mat4.multiply(mat4.create(), viewProjectionMatrix, model);
        gl.uniformMatrix4fv(u_Matrix, false, uMatrix); // общий MVP - есть у всех

        updatePerFrame?.({ modelMatrix: model, viewProjection: viewProjectionMatrix });

        // type - определяет тип индексов: gl.UNSIGNED_BYTE (для Uint8Array) или gl.UNSIGNED_SHORT (для Uint16Array);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      }
    },
  });
}
