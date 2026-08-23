import { createShader } from './create-shader';

interface CreateProgram {
  gl: WebGL2RenderingContext;
  vertex: string;
  fragment: string;
}

export function createProgram({ gl, vertex, fragment }: CreateProgram) {
  const vertexShader = createShader({ gl, type: gl.VERTEX_SHADER, source: vertex });
  const fragmentShader = createShader({ gl, type: gl.FRAGMENT_SHADER, source: fragment });

  // 4. Создание объекта программы
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error('Не удалось создать объект программы');
  }

  // 5. Подключение шейдеров к программе
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  // 6. Компонует объект программы
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(`Ошибка компоновки программы: ${log}`);
  }

  /**
   * Программа прикреплена (слинкована) - объекты шейдеров больше не нужны.
   * deleteShader лишь ПОМЕЧАЕТ их к удалению: пока они прикреплены к program, они живут,
   * а реально освободятся вместе с gl.deleteProgram(program).
   * Поэтому очистка при размонтировании = только deleteProgram
   * */
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}
