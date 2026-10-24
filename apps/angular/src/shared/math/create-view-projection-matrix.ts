import { mat4 } from 'gl-matrix';
import { ElementRef, Signal } from '@angular/core';

interface CreateViewProjectionMatrix {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewMatrix: Signal<mat4>;
  near?: number;
  far?: number;
}

export function createViewProjectionMatrix({ canvasRef, viewMatrix, near = 1, far = 100 }: CreateViewProjectionMatrix) {
  return () => {
    const canvas = canvasRef().nativeElement;
    const aspect = canvas.width / canvas.height;
    const projection = mat4.perspective(mat4.create(), (Math.PI * 30) / 180, aspect, near, far);
    return mat4.multiply(mat4.create(), projection, viewMatrix());
  };
}
