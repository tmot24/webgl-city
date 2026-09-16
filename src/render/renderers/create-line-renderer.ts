import { mat4, vec3 } from 'gl-matrix';
import { createGLProgram } from '../../shared/gl/create-gl-program';
import vertex from '../material/line-material/line-material.vert';
import fragment from '../material/line-material/line-material.frag';
import { createVAO } from '../../shared/gl/create-vao';
import { createLineMaterial, LINE_ATTRIBUTES_LOCATION } from '../material/line-material/line-material';
import { EPSILON, FLOATS_PER_SEGMENT, LINE_COLOR, LINE_HALF_WIDTH_FACTOR } from '../../shared/constants';

export interface LineRenderer {
  // points - ломаная (N точек => N-1 сегментов)
  draw: (frame: { viewProjection: mat4; eye: vec3; points: vec3[] | null }) => void;
  dispose: () => void;
}

/**
 * Рендер ломаной (маршрут/измерение) билборд-прямоугольниками: каждый сегмент -
 * прямоугольник, повёрнутый к камере, толщина масштабируется расстоянием. Поверх всего (без depth).
 * Вершины пересобираются каждый кадр; буфер растёт под самую длинную ломаную.
 * */
export function createLineRenderer({ gl }: { gl: WebGL2RenderingContext }): LineRenderer {
  const program = createGLProgram({ gl, vertex, fragment });

  const { vao, buffers } = createVAO({
    gl,
    attributes: [
      {
        location: LINE_ATTRIBUTES_LOCATION.position,
        srcData: new Float32Array(FLOATS_PER_SEGMENT), // старт на 1 сегмент, дальше растём
        size: 3,
        usage: gl.DYNAMIC_DRAW,
      },
    ],
  });
  const positionBuffer = buffers[0];

  gl.useProgram(program);
  const material = createLineMaterial({ gl, program });

  let vertices = new Float32Array(FLOATS_PER_SEGMENT); // CPU-буфер, только растёт
  let gpuCapacity = FLOATS_PER_SEGMENT; // сколько float влезает в GPU-буфер сейчас

  // переиспользуемые временные векторы (без аллокаций в цикле)
  const mid = vec3.create();
  const toCamera = vec3.create();
  const viewDir = vec3.create();
  const lineDir = vec3.create();
  const side = vec3.create();

  const draw: LineRenderer['draw'] = ({ viewProjection, eye, points }) => {
    if (!points || points.length < 2) return;

    const segments = points.length - 1;
    const floats = segments * FLOATS_PER_SEGMENT;
    if (vertices.length < floats) {
      vertices = new Float32Array(floats);
    }

    let o = 0;
    const put = ({ x, y, z }: { x: number; y: number; z: number }) => {
      vertices[o++] = x;
      vertices[o++] = y;
      vertices[o++] = z;
    };

    for (let k = 0; k < segments; k++) {
      const a = points[k];
      const b = points[k + 1];

      // Билборд-side для этого сегмента (перпендикуляр к линии и к направлению на камеру)
      vec3.lerp(mid, a, b, 0.5);
      vec3.subtract(toCamera, eye, mid);
      const distance = vec3.length(toCamera);
      vec3.scale(viewDir, toCamera, 1 / distance);
      vec3.normalize(lineDir, vec3.subtract(lineDir, b, a));
      vec3.cross(side, lineDir, viewDir);
      const sideLen = vec3.length(side);
      if (sideLen < EPSILON) {
        vec3.set(side, 0, 0, 0); // сегмент смотрит в камеру (схлопнутый квад не рисуется)
      } else {
        vec3.scale(side, side, (LINE_HALF_WIDTH_FACTOR * distance) / sideLen);
      }

      // Два треугольника прямоугольника: (a+side, a-side, b-side) и (a+side, b-side, b+side)
      put({ x: a[0] + side[0], y: a[1] + side[1], z: a[2] + side[2] });
      put({ x: a[0] - side[0], y: a[1] - side[1], z: a[2] - side[2] });
      put({ x: b[0] - side[0], y: b[1] - side[1], z: b[2] - side[2] });
      put({ x: a[0] + side[0], y: a[1] + side[1], z: a[2] + side[2] });
      put({ x: b[0] - side[0], y: b[1] - side[1], z: b[2] - side[2] });
      put({ x: b[0] + side[0], y: b[1] + side[1], z: b[2] + side[2] });
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    if (gpuCapacity < vertices.length) {
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW); // выросли - перевыделяем GPU-буфер
      gpuCapacity = vertices.length;
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices, 0, floats);
    }

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    material.updatePerFrame({ viewProjection, color: LINE_COLOR });

    gl.disable(gl.DEPTH_TEST); // поверх всего
    gl.drawArrays(gl.TRIANGLES, 0, segments * 6);
    gl.enable(gl.DEPTH_TEST); // вернуть для остального рендера

    gl.bindVertexArray(null);
  };

  const dispose = () => {
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  };

  return { draw, dispose };
}
