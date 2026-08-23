export interface VaoAttribute {
  // Определяет переменную-атрибут, которой будет выполнено присваивание
  location: GLuint;
  // Данные для записи в буферный объект (типизированный массив)
  srcData: ArrayBufferView;
  // Определяет число компонентов на вершину в буферном объекте (допустимыми являются значения от 1 до 4)
  size: GLint;
  // Формат данных
  type?: GLenum;
  // Либо true, либо false. Указывает на необходимость нормализации невещественных данных
  normalized?: boolean;
  // Определяет число байтов между разными элементами данных. Значение по умолчанию 0.
  // При смешивании данных в одном массиве необходимо всегда передавать stride отличный от нуля.
  // Необходимо прочитать BYTES_PER_ELEMENT в зависимости от srcData, например Float32Array.BYTES_PER_ELEMENT и
  // умножить его на количество уникальных данных в вершине
  stride?: GLsizei;
  // Определяет смещение (в байтах) от начала буферного объекта, где хранятся данные для вершин
  offset?: GLintptr;
  // Подсказка о том, как программа собирается использовать данные в буферном объекте
  usage?: GLenum;
}

interface CreateVAO {
  gl: WebGL2RenderingContext;
  attributes: VaoAttribute[];
  indices?: {
    // Индексы вершин, Element Buffer Object (EBO)
    srcData: ArrayBufferView;
    // По умолчанию gl.STATIC_DRAW
    usage?: GLenum;
  };
}

// VAO - контейнер конфигурации атрибутов (Vertex Array Object)
export function createVAO({ gl, attributes, indices }: CreateVAO) {
  /**
   * Контейнер, который запоминает конфигурацию атрибутов,
   * какой буфер к какому атрибуту, размеры, типы, что включено.
   * */
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao); // с этого момента настройки атрибутов пишутся в vao

  const buffers = attributes.map(
    ({
      location,
      srcData,
      size,
      type = getGLTypeFromArrayBuffer({ data: srcData }),
      normalized = false,
      stride = 0,
      offset = 0,
      usage = gl.STATIC_DRAW,
    }) => {
      /**
       * Создаёт буферный объект
       * */
      const buffer = gl.createBuffer(); // 1. Создать буферный объект
      /**
       * Активирует буферный объект и указывает его тип:
       * Параметры:
       * target - может иметь одно из значений:
       *  а) gl.ARRAY_BUFFER - указывает, что буферный объект содержит информацию о вершинах
       *  б) ELEMENT_ARRAY_BUFFER - указывает, что буферный объект содержит значения индексов, ссылающихся
       *  на информацию о вершинах
       * buffer - ссылка на буферный объект, предварительно созданный вызовом gl.createBuffer()
       * */
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // 2. Указать тип буферного объекта
      /**
       * Выделяет память для буферного объекта и записывает данные srcData в буферный объект, тип которого
       * определяется параметром target
       * Параметры:
       * target - gl.ARRAY_BUFFER или ELEMENT_ARRAY_BUFFER
       * srcData - Данные для записи в буферный объект (типизированный массив)
       * usage - Подсказка о том, как программа собирается использовать данные в буферном объекте.
       * Эта подсказка помогает системе WebGL оптимизировать производительность, но не является страховкой от ошибок
       * в программе.
       *  а) gl.STATIC_DRAW - Данные в буферном объекте будут определены один раз и использованы многократно для рисования фигур.
       *  б) gl.STREAM_DRAW - Данные в буферном объекте будут определены один раз и использованы лишь несколько раз для
       *  рисования фигур.
       *  в) gl.DYNAMIC_DRAW - Данные в буферном объекте будут определены многократно и использованы для рисования фигур
       *  так же многократно
       * */
      gl.bufferData(gl.ARRAY_BUFFER, srcData, usage); // 3. Записать данные в буферный объект
      /**
       * Присваивает буферный объект тип gl.ARRAY_BUFFER переменной-атрибуту location
       * Параметры:
       * location - Определяет переменную-атрибут, которой будет выполнено присваивание.
       * size - Определяет число компонентов на вершину в буферном объекте (допустимыми являются значения от 1 до 4).
       * Если значения параметра size меньше числа элементов, требуемых переменной-атрибутом, отсутствующие компоненты
       * автоматически получат значения по умолчанию 0.0, а четвёртый 1.0,
       * как указывается в описании семейства методов gl.vertexAttrib[1234]f()
       * type - Определяет формат данных. Может иметь одно из значений:
       *  а) gl.UNSIGNED_BYTE - беззнаковый байт для Uint8Array
       *  б) gl.SHORT - короткое целое со знаком для Int16Array
       *  в) gl.UNSIGNED_SHORT - короткое целое без знака для Uint16Array
       *  г) gl.INT - целое со знаком для Int32Array
       *  д) gl.UNSIGNED_INT - целое без знака для Uint32Array
       *  е) gl.FLOAT - вещественное для Float32Array
       * normalized - Либо true, либо false. Указывает на необходимость нормализации невещественных данных
       * в диапазон [0, 1] или [-1, 1].
       * stride - Определяет длину шага (в байтах) между разными элементами данных. Значение по умолчанию 0.
       * offset - Определяет смещение (в байтах) от начала буферного объекта, где хранятся данные для вершин.
       * Если данные хранятся с самого начала буфера, в этом параметре следует передать значение 0.
       * */
      gl.vertexAttribPointer(location, size, type, normalized, stride, offset); // 4. Сохранить ссылку на буферный объект в переменной a_Position
      /**
       * Разрешает присваивание буферного объекта переменной-атрибуту, определяемой параметром location.
       * Параметры:
       * location - Определяет переменную-атрибут.
       * */
      gl.enableVertexAttribArray(location); // 5. Разрешить присваивание переменной a_Position

      return buffer;
    },
  );

  // Индексный буфер (EBO) - если передан.
  // ВАЖНО: привязать, пока VAO активен, чтобы привязка записалась в VAO.
  let indexBuffer: WebGLBuffer | null = null;
  if (indices) {
    const { srcData, usage = gl.STATIC_DRAW } = indices;
    indexBuffer = gl.createBuffer();
    // Тип ELEMENT_ARRAY_BUFFER - это индексы, а не вершинные данные
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, srcData, usage);
    // Не отвязываем ELEMENT_ARRAY_BUFFER до bindVertexArray(null) - иначе VAO не запомнит EBO
  }

  // Отвязываем, чтобы случайные последующие вызовы не писались в наш VAO
  gl.bindVertexArray(null);

  return { vao, buffers, indexBuffer };
}

const typeMap = new Map<Function, GLenum>([
  [Float32Array, WebGL2RenderingContext.FLOAT],
  [Float64Array, WebGL2RenderingContext.FLOAT],
  [Int8Array, WebGL2RenderingContext.BYTE],
  [Uint8Array, WebGL2RenderingContext.UNSIGNED_BYTE],
  [Uint8ClampedArray, WebGL2RenderingContext.UNSIGNED_BYTE],
  [Int16Array, WebGL2RenderingContext.SHORT],
  [Uint16Array, WebGL2RenderingContext.UNSIGNED_SHORT],
  [Int32Array, WebGL2RenderingContext.INT],
  [Uint32Array, WebGL2RenderingContext.UNSIGNED_INT],
  [Float16Array, WebGL2RenderingContext.HALF_FLOAT],
]);

function getGLTypeFromArrayBuffer({ data }: { data: ArrayBufferView }): GLenum {
  return typeMap.get(data.constructor) ?? WebGL2RenderingContext.FLOAT;
}
