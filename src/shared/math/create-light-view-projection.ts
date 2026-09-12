import { mat4, vec3 } from 'gl-matrix';

interface CreateLightViewProjection {
  // Направление НА свет (солнце). Не обязательно нормированное - нормализация внутри
  lightDirection: vec3;
  // Центр сцены (город центрирован в 0 => vec3.create())
  center: vec3;
  // Радиус охватывающей сферы сцены: свет и ортобокс строятся вокруг неё
  radius: number;
}

/**
 * Ортографическая матрица "вид из солнца" для карты теней (directional light).
 * Свет ставим за пределами сцены вдоль направления НА свет, смотрим в центр,
 * а ортобокс делаем ровно по сфере радиуса radius - тогда вся сцена попадает в карту
 * при любом угле солнца, без подстройки под кадр и без мерцания
 * */
export function createLightViewProjection({ lightDirection, center, radius }: CreateLightViewProjection): mat4 {
  const lightDir = vec3.normalize(vec3.create(), lightDirection);

  // Позиция "солнца": на 2 радиуса от центра вдоль направления НА свет (гарантировано снаружи сцены)
  const lightDistance = radius * 2;
  const lightPos = vec3.scaleAndAdd(vec3.create(), center, lightDir, lightDistance);

  // up выбираем так, чтобы совпасть с направлением взгляда (иначе lookAt вырождается, ломается):
  // если свет почти вертикальный - берём ось Z, иначе обычный "вверх" Y
  const worldUp = Math.abs(lightDir[1]) > 0.99 ? vec3.fromValues(0, 0, 1) : vec3.fromValues(0, 1, 0);

  const view = mat4.lookAt(mat4.create(), lightPos, center, worldUp);

  const projection = mat4.ortho(
    mat4.create(),
    -radius, // лево
    radius, // право
    -radius, // низ
    radius, // верх
    lightDistance - radius, // ближайшее
    lightDistance + radius, // дальнее
  );

  return mat4.multiply(mat4.create(), projection, view);
}
