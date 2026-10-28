interface CreateShader {
  gl: WebGL2RenderingContext;
  type: GLenum; // gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
  source: string;
}

export function createShader({ gl, type, source }: CreateShader) {
  // 1. Создание объекта шейдеров
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Не удалось создать объект шейдера');

  // 2. Привязать шейдеры
  gl.shaderSource(shader, source);
  // 3. Компиляция шейдеров
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    const kind = type === gl.VERTEX_SHADER ? 'вершинного' : 'фрагментного';
    throw new Error(`Ошибка компиляции ${kind} шейдера: ${log}`);
  }

  return shader;
}
