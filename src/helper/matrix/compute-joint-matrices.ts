import { mat4, vec3 } from 'gl-matrix';
import { getRadianFromDegree } from '../common/get-radian-from-degree';

interface Segment {
  height: number;
  width: number;
  depth: number;
}

interface ComputeJointMatrices {
  // Матрица родителя (место крепления)
  parentBase: mat4;
  // Смещение от родителя до сустава (обычно [0, длина_родителя, 0])
  offset: vec3;
  // Поворот в суставе
  rotation: { axis: vec3; deg: number };
  // Размеры меша
  segment: Segment;
  // высота исходника
  cubeHeight: number;
}

/**
 * Вычисляет сегмент и возвращает base (точку крепления для детей) и model (отрисовка) матрицы
 * */
export function computeJointMatrices({ parentBase, offset, rotation, segment, cubeHeight }: ComputeJointMatrices) {
  // base = позиция сустава + поворот (это наследуют дети, БЕЗ масштаба меша)
  const base = mat4.clone(parentBase);
  mat4.translate(base, base, offset);
  mat4.rotate(base, base, getRadianFromDegree(rotation.deg), rotation.axis);

  // model = base + подъём центра меша + масштаб под форму (только для отрисовки)
  const model = mat4.clone(base);
  // Поднимаем центр меша на пол длины вверх, чтобы основание сегмента оказалось в точке крепления
  // (потому что исходный куб имеет координаты от -1 до +1)
  mat4.translate(model, model, vec3.fromValues(0, segment.height / 2, 0));
  mat4.scale(model, model, vec3.fromValues(segment.width, segment.height / cubeHeight, segment.depth));

  return {
    base,
    model,
  };
}
