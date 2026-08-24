import { mat4, vec3 } from 'gl-matrix';
import { InstanceData } from '../../city/build-instance-data';
import { constructCubeGeometry } from '../geometry/construct-cube-geometry';
import { createProgram } from '../core/create-program';
import vertex from '../../material/building-material/building-material.vert';
import fragment from '../../material/building-material/building-material.frag';
import { createVAO } from '../mesh/create-vao';
import {
  BUILDING_ATTRIBUTES_LOCATION,
  createBuildingMaterial,
} from '../../material/building-material/building-material';

export interface BuildingRenderer {
  draw: (frame: { viewProjection: mat4; lightDirection: vec3 }) => void;
  dispose: () => void;
}

// Рендер зданий: экземпляр куба со светом.
export function createBuildingRenderer({
  gl,
  instanceData,
}: {
  gl: WebGL2RenderingContext;
  instanceData: InstanceData;
}): BuildingRenderer {
  const geometry = constructCubeGeometry();
  const program = createProgram({ gl, vertex, fragment });

  const { vao, buffers, indexBuffer } = createVAO({
    gl,
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

  gl.useProgram(program);
  const material = createBuildingMaterial({ gl, program });

  const draw = ({ viewProjection, lightDirection }: { viewProjection: mat4; lightDirection: vec3 }) => {
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    material.updatePerFrame({ viewProjection, lightDirection });
    // Один вызов на весь город: 36 индексов куба * instanceData.count зданий
    gl.drawElementsInstanced(gl.TRIANGLES, geometry.count, gl.UNSIGNED_SHORT, 0, instanceData.count);
    gl.bindVertexArray(null);
  };

  const dispose = () => {
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    if (indexBuffer) gl.deleteBuffer(indexBuffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  };

  return { draw, dispose };
}
