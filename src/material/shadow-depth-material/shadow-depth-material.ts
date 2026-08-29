import { mat4 } from 'gl-matrix';

export interface ShadowDepthFrame {
  lightViewProjection: mat4;
}

export interface ShadowDepthMaterial {
  updatePerFrame: (frame: ShadowDepthFrame) => void;
}

// Материал depth-пасса: единственный uniform — матрица «взгляд из солнца».
export function createShadowDepthMaterial({
  gl,
  program,
}: {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
}): ShadowDepthMaterial {
  const u_LightViewProjection = gl.getUniformLocation(program, 'u_LightViewProjection');
  if (!u_LightViewProjection) throw new Error('uniform u_LightViewProjection не найден');

  return {
    updatePerFrame: ({ lightViewProjection }) => {
      gl.uniformMatrix4fv(u_LightViewProjection, false, lightViewProjection);
    },
  };
}
