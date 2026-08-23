import { mat4, quat, vec3 } from 'gl-matrix';

interface ComposeModel {
  // T — перемещение
  translate?: vec3;
  // R — поворот
  rotate?:
    | {
        radian: number;
        axis: vec3;
      }
    | quat;
  // S — масштаб
  scale?: vec3;
}

/**
 * Возвращает T × R × S. Отсутствующие множители пропускаются.
 * */
export function composeModel({
  translate = vec3.fromValues(0.0, 0.0, 0.0),
  rotate,
  scale = vec3.fromValues(1.0, 1.0, 1.0),
}: ComposeModel) {
  const rotation = quat.create(); // единичный, без поворота
  if (rotate) {
    if ('axis' in rotate) {
      // передали ось + угол - строим кватернион сами
      quat.setAxisAngle(rotation, rotate.axis, rotate.radian);
    } else {
      quat.copy(rotation, rotate);
    }
  }
  return mat4.fromRotationTranslationScale(mat4.create(), rotation, translate, scale);
}
