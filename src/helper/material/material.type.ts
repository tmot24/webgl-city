import { DestroyRef, Signal } from '@angular/core';
import { mat4 } from 'gl-matrix';

export interface AttributeSpec {
  geometryKey: 'position' | 'color' | 'texCoord' | 'normal'; // какой атрибут геометрии берём
  location: number;
  size: number;
}

export type MaterialUpdatePerFrame = (params: { modelMatrix: mat4; viewProjection: mat4 }) => void;

export interface MaterialType {
  vertex: string;
  fragment: string;
  attributes: AttributeSpec[]; // что материал читает из геометрии
  // одноразовая настройка (кэш локаций, статичные uniform, текстуры)
  setup?: (params: { gl: WebGL2RenderingContext; program: WebGLProgram; destroyRef: DestroyRef }) => {
    isReady?: Signal<boolean>;
    // покадровое обновление per-object uniform (нормальная матрица, модель и т.д.)
    updatePerFrame?: (params: MaterialUpdatePerFrame) => void;
  } | void;
}
