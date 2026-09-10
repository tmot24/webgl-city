import { mat4, vec3 } from 'gl-matrix';
import { Measurement } from '../../inject/inject-measure';
import { createGLProgram } from '../core/create-gl-program';
import vertex from '../../material/line-material/line-material.vert';
import fragment from '../../material/line-material/line-material.frag';
import { createVAO } from '../mesh/create-vao';
import { createLineMaterial, LINE_ATTRIBUTES_LOCATION } from '../../material/line-material/line-material';
import { EPSILON } from '../constants';

export interface LineRenderer {
  draw: (frame: { viewProjection: mat4; eye: vec3; measurement: Measurement | null }) => void;
  dispose: () => void;
}

const LINE_COLOR = vec3.fromValues(1.0, 0.75, 0.1);
// Полутолщина = factor * расстояние до камеры => на экране толщина почти постоянна на любом зуме
const LINE_HALF_WIDTH_FACTOR = 0.001;

/**
 * Рендер измерительной линии: отрезок a->b рисуется билборд-прямоугольником
 * (перпендикуляр к линии, обращённый к камере), поверх всей сцены (без depth-теста).
 * Квад пересобирается каждый кадр из текущего измерения и позиции камеры.
 * */
export function createLineRenderer({ gl }: { gl: WebGL2RenderingContext }): LineRenderer {
  const program = createGLProgram({ gl, vertex, fragment });

  const { vao, buffers } = createVAO({
    gl,
    attributes: [
      {
        location: LINE_ATTRIBUTES_LOCATION.position,
        srcData: new Float32Array(12), // заглушка, перезаписывается в draw
        size: 3,
        usage: gl.DYNAMIC_DRAW,
      },
    ],
  });
  const positionBuffer = buffers[0];

  gl.useProgram(program);
  const material = createLineMaterial({ gl, program });

  const quad = new Float32Array(12); // переиспользуемый CPU-буфер вершин

  const draw = ({
    viewProjection,
    eye,
    measurement,
  }: {
    viewProjection: mat4;
    eye: vec3;
    measurement: Measurement | null;
  }) => {
    if (!measurement) return;
    const { a, b } = measurement;

    // Билборд: боковой вектор = перпендикуляр к линии и к направлению на камеру
    const mid = vec3.lerp(vec3.create(), a, b, 0.5); // lerp - линейная интерполяция между двумя векторами
    const toCamera = vec3.subtract(vec3.create(), eye, mid);
    const distance = vec3.length(toCamera);
    const viewDir = vec3.scale(vec3.create(), toCamera, 1 / distance);
    const lineDir = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), b, a));

    const side = vec3.cross(vec3.create(), lineDir, viewDir);
    const sideLen = vec3.length(side);
    if (sideLen < EPSILON) return; // линия смотрит прямо в камеру - квад вырожден, пропускаем кадр
    vec3.scale(side, side, (LINE_HALF_WIDTH_FACTOR * distance) / sideLen); // нормализуем + толщина

    // 4 вершины прямоугольника (TRIANGLE_STRIP): a+side, a-side, b+side, b-side
    quad[0] = a[0] + side[0];
    quad[1] = a[1] + side[1];
    quad[2] = a[2] + side[2];
    quad[3] = a[0] - side[0];
    quad[4] = a[1] - side[1];
    quad[5] = a[2] - side[2];
    quad[6] = b[0] + side[0];
    quad[7] = b[1] + side[1];
    quad[8] = b[2] + side[2];
    quad[9] = b[0] - side[0];
    quad[10] = b[1] - side[1];
    quad[11] = b[2] - side[2];

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, quad);

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    material.updatePerFrame({ viewProjection, color: LINE_COLOR });

    gl.disable(gl.DEPTH_TEST); // поверх всего - измерительный инструмент
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
