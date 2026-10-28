import { mat4, vec3 } from 'gl-matrix';

export const FLAT_ATTRIBUTES_LOCATION = {
  position: 0,
} as const;

// Данные, обновляемые каждый кадр: матрица камеры + сплошной цвет поверхности.
export interface FlatFrame {
  viewProjection: mat4;
  color: vec3;
  lightViewProjection: mat4;
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
  const u_LightViewProjection = gl.getUniformLocation(program, 'u_LightViewProjection');
  const u_ShadowMap = gl.getUniformLocation(program, 'u_ShadowMap');
  if (!u_ViewProjection) throw new Error('uniform u_ViewProjection не найден');
  if (!u_Color) throw new Error('uniform u_Color не найден');
  if (!u_LightViewProjection) throw new Error('uniform u_LightViewProjection не найден');
  if (!u_ShadowMap) throw new Error('uniform u_ShadowMap не найден');

  // Карта теней на текстурном юните 0
  gl.uniform1i(u_ShadowMap, 0);

  return {
    updatePerFrame: ({ viewProjection, color, lightViewProjection }) => {
      gl.uniformMatrix4fv(u_ViewProjection, false, viewProjection);
      gl.uniform3fv(u_Color, color);
      gl.uniformMatrix4fv(u_LightViewProjection, false, lightViewProjection);
    },
  };
}
