import { mat4 } from 'gl-matrix';
import { InstanceData } from '../../city/build-instance-data';
import { DestroyRef } from '@angular/core';
import { constructCubeGeometry } from '../geometry/construct-cube-geometry';
import { createGLProgram } from '../core/create-gl-program';
import vertex from '../../material/shadow-depth-material/shadow-depth.vert';
import fragment from '../../material/shadow-depth-material/shadow-depth.frag';
import { createVAO } from '../mesh/create-vao';
import { BUILDING_ATTRIBUTES_LOCATION } from '../../material/building-material/building-material';
import { createShadowDepthMaterial } from '../../material/shadow-depth-material/shadow-depth-material';
import { createFramebuffer } from '../core/create-framebuffer';

export interface ShadowRender {
  // Карта теней (depth-текстура)
  depthTexture: WebGLTexture;
  // Размер карты в текселях (пригодится для 1/size при мягких тенях)
  size: number;
  // Рендер глубины города из точки зрения солнца в карту теней
  renderDepth: (frame: { lightViewProjection: mat4 }) => void;
  dispose: () => void;
}

/**
 * Проход глубины теней: рисует глубину зданий из "взгляда солнца" в depth-текстуру.
 * Здания - (пока) единственные, кто отбрасывает тень; земля/дороги только принимают.
 * Свой VAO (position/translation/scale) - рендерер самодостаточен; normal для глубины не нужен
 * */
export function createShadowRender({
  gl,
  instanceData,
  destroyRef,
  size = 2048,
}: {
  gl: WebGL2RenderingContext;
  instanceData: InstanceData;
  destroyRef: DestroyRef;
  size?: number;
}): ShadowRender {
  const geometry = constructCubeGeometry();
  const program = createGLProgram({
    gl,
    vertex,
    fragment,
  });

  const { vao, buffers, indexBuffer } = createVAO({
    gl,
    attributes: [
      {
        location: BUILDING_ATTRIBUTES_LOCATION.position,
        srcData: geometry.position,
        size: 3,
      },
      // per-instance: divisor 1 (одно значение на здание)
      {
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
    indices: { srcData: geometry.indices },
  });

  gl.useProgram(program);

  const material = createShadowDepthMaterial({ gl, program });

  // Карта теней: framebuffer только с depth-текстурой (color: false)
  const { framebuffer, depthTexture } = createFramebuffer({
    gl,
    width: size,
    height: size,
    destroyRef,
    depth: 'texture',
    color: false,
  });
  if (!depthTexture) throw new Error('shadow map: depthTexture не создан');

  const renderDepth: ShadowRender['renderDepth'] = ({ lightViewProjection }) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, size, size);
    gl.clear(gl.DEPTH_BUFFER_BIT); // цвета нет - чистим только глубину

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    material.updatePerFrame({ lightViewProjection });
    // Один вызов на весь город - как и в основном проходе
    gl.drawElementsInstanced(gl.TRIANGLES, geometry.count, gl.UNSIGNED_SHORT, 0, instanceData.count);
    gl.bindVertexArray(null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // вернуть рендер на экран
  };

  const dispose = () => {
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    if (indexBuffer) gl.deleteBuffer(indexBuffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  };

  return { depthTexture, size, renderDepth, dispose };
}
