import { mat4, vec3 } from 'gl-matrix';

export const FLAT_ATTRIBUTES_LOCATION = {
  position: 0,
} as const;

// Данные, обновляемые каждый кадр: матрица камеры + сплошной цвет поверхности.
export interface FlatFrame {
  viewProjection: mat4;
  color: vec3;
}

export interface FlatColorMaterial {
  updatePerFrame: (frame: FlatFrame) => void;
}

// Плоский одноцветный материал: используется и для травы, и для дорог (разный u_Color)
export function createFlatColorMaterial({
  gl,
  program,
}: {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
}): FlatColorMaterial {
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
