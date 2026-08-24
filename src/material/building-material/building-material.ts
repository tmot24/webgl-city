import { mat4, vec3 } from 'gl-matrix';

export const BUILDING_ATTRIBUTES_LOCATION = {
  position: 0,
  normal: 1,
  translation: 2,
  scale: 3,
} as const;

export interface BuildFrame {
  viewProjection: mat4;
  // направление НА свет, нормализованное (реактивное "солнце")
  lightDirection: vec3;
}

export interface BuildingMaterial {
  // покадровое обновление uniform; программа должна быть активна (useProgram) на момент вызова
  updatePerFrame: (frame: BuildFrame) => void;
}

export function createBuildingMaterial({
  gl,
  program,
}: {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
}): BuildingMaterial {
  const u_ViewProjection = gl.getUniformLocation(program, 'u_ViewProjection');
  const u_LightDirection = gl.getUniformLocation(program, 'u_LightDirection');
  if (!u_ViewProjection) throw new Error('uniform u_ViewProjection не найден');
  if (!u_LightDirection) throw new Error('uniform u_LightDirection не найден');

  return {
    updatePerFrame: ({ viewProjection, lightDirection }) => {
      gl.uniformMatrix4fv(u_ViewProjection, false, viewProjection);
      gl.uniform3fv(u_LightDirection, lightDirection);
    },
  };
}
