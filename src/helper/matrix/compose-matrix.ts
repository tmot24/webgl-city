import { mat4 } from 'gl-matrix';

interface ComposeMatrix {
  // P — проекция (или aspect-заглушка)
  projection?: mat4;
  // V — матрица вида (камера)
  view?: mat4;
  // M — трансформация объекта (T × R × S)
  model?: mat4;
}

/**
 * Возвращает P × V × M. Отсутствующие множители пропускаются.
 * */
export function composeMatrix({ projection, view, model }: ComposeMatrix) {
  // Начинаем с единичной: умножение на неё ничего не меняет - удобная "пустая" база
  const result = mat4.create();

  // Перемножаем слева направо в каноничном порядке P → V → M;
  // каждый шаг: result = result × next (next применится ПОЗЖЕ уже накопленного справа)
  for (const matrix of [projection, view, model]) {
    if (matrix) {
      mat4.multiply(result, result, matrix);
    }
  }

  return result;
}
