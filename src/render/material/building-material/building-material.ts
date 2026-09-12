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
  // "взгляд из солнца" для выборки тени
  lightViewProjection: mat4;
  // индекс выбранного здания или -1
  selectedId: number;
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
  const u_LightViewProjection = gl.getUniformLocation(program, 'u_LightViewProjection');
  const u_ShadowMap = gl.getUniformLocation(program, 'u_ShadowMap');
  const u_SelectedId = gl.getUniformLocation(program, 'u_SelectedId');
  if (!u_ViewProjection) throw new Error('uniform u_ViewProjection не найден');
  if (!u_LightDirection) throw new Error('uniform u_LightDirection не найден');
  if (!u_LightViewProjection) throw new Error('uniform u_LightViewProjection не найден');
  if (!u_ShadowMap) throw new Error('uniform u_ShadowMap не найден');
  if (!u_SelectedId) throw new Error('uniform u_SelectedId не найден');

  // Карта теней лежит на текстурном юните 0 (программа активна на момент вызова)
  gl.uniform1i(u_ShadowMap, 0);

  return {
    updatePerFrame: ({ viewProjection, lightDirection, lightViewProjection, selectedId }) => {
      gl.uniformMatrix4fv(u_ViewProjection, false, viewProjection);
      gl.uniform3fv(u_LightDirection, lightDirection);
      gl.uniformMatrix4fv(u_LightViewProjection, false, lightViewProjection);
      gl.uniform1i(u_SelectedId, selectedId);
    },
  };
}
