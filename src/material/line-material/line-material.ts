import { mat4, vec3 } from 'gl-matrix';

export const LINE_ATTRIBUTES_LOCATION = {
  position: 0,
} as const;

export interface LineFrame {
  viewProjection: mat4;
  color: vec3;
}

export interface LineMaterial {
  updatePerFrame: (frame: LineFrame) => void;
}

// Простой материал линии: позиция в клип-пространство + сплошной цвет. Без света и теней (оверлей)
export function createLineMaterial({
  gl,
  program,
}: {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
}): LineMaterial {
  const u_ViewProjection = gl.getUniformLocation(program, 'u_ViewProjection');
  const u_Color = gl.getUniformLocation(program, 'u_Color');
  if (!u_ViewProjection) throw new Error('uniform u_ViewProjection не найден');
  if (!u_Color) throw new Error('uniform u_Color не найден');

  return {
    updatePerFrame: ({ viewProjection, color }) => {
      gl.uniformMatrix4fv(u_ViewProjection, false, viewProjection);
      gl.uniform3fv(u_Color, color);
    },
  };
}
