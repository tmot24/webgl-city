import vertex from '../../material/flat-color-material/flat-color-material.vert';
import fragment from '../../material/flat-color-material/flat-color-material.frag';
import { FlatGeometry } from '../../road/build-road-geometry';
import { mat4, vec3 } from 'gl-matrix';
import { createProgram } from '../core/create-program';
import {
  createFlatColorMaterial,
  FLAT_ATTRIBUTES_LOCATION,
} from '../../material/flat-color-material/flat-color-material';
import { createVAO } from '../mesh/create-vao';

export interface Surface {
  geometry: FlatGeometry;
  color: vec3;
}

export interface SurfaceRenderer {
  draw: (frame: { viewProjection: mat4 }) => void;
  dispose: () => void;
}

export function createSurfaceRenderer({
  gl,
  surfaces,
}: {
  gl: WebGL2RenderingContext;
  surfaces: Surface[];
}): SurfaceRenderer {
  const program = createProgram({ gl, vertex, fragment });
  gl.useProgram(program);
  const material = createFlatColorMaterial({ gl, program });

  // Каждой поверхности свой VAO (position) + цвет и число индексов
  const items = surfaces.map(({ geometry, color }) => {
    const { vao, buffers, indexBuffer } = createVAO({
      gl,
      attributes: [
        {
          location: FLAT_ATTRIBUTES_LOCATION.position,
          srcData: geometry.position,
          size: 3,
        },
      ],
      indices: { srcData: geometry.indices },
    });
    return { vao, buffers, indexBuffer, count: geometry.count, color };
  });

  const draw = ({ viewProjection }: { viewProjection: mat4 }) => {
    gl.useProgram(program);
    for (const item of items) {
      gl.bindVertexArray(item.vao);
      material.updatePerFrame({ viewProjection, color: item.color });
      gl.drawElements(gl.TRIANGLES, item.count, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindVertexArray(null);
  };

  const dispose = () => {
    for (const { vao, buffers, indexBuffer } of items) {
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      if (indexBuffer) gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
    }
    gl.deleteProgram(program);
  };

  return { draw, dispose };
}
