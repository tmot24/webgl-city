import { mat4 } from 'gl-matrix';

interface CreateViewProjectionMatrix {
  aspect: number;
  viewMatrix: mat4;
  near?: number;
  far?: number;
  fovDeg?: number;
}

export function createViewProjectionMatrix({
  aspect,
  viewMatrix,
  near = 1,
  far = 100,
  fovDeg = 30,
}: CreateViewProjectionMatrix) {
  const projection = mat4.perspective(mat4.create(), (Math.PI * fovDeg) / 180, aspect, near, far);
  return mat4.multiply(mat4.create(), projection, viewMatrix);
}
