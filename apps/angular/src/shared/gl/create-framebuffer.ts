import { DestroyRef } from '@angular/core';

/**
 * Прошлый урок (куб) → depth: 'renderbuffer' (или дефолт), color: true.
 * Тени → depth: 'texture', color: false (нужна только глубина).
 * Heatmap → depth: 'none'.
 */
type DepthMode = 'none' | 'renderbuffer' | 'texture';

interface CreateFramebuffer {
  gl: WebGL2RenderingContext;
  width: number; // размер offscreen-текстуры (степень двойки, 512)
  height: number;
  destroyRef: DestroyRef;
  depth?: DepthMode;
  color?: boolean; // нужна ли цветовая текстура; для shadow map - false
}

export interface Framebuffer {
  framebuffer: WebGLFramebuffer;
  colorTexture: WebGLTexture | null; // цвет (если color: true)
  depthTexture: WebGLTexture | null; // глубина как текстура (если depth: 'texture') - это shadow map
  width: number;
  height: number;
}

/**
 * Создаёт offscreen-цель рендера: framebuffer с цветовой текстурой и depth-буфером.
 * Depth обязателен - внутрь рисуется объёмный куб, без него грани полезут друг на друга.
 * Вызывать один раз (это ресурс, как VAO/текстура).
 * */
export function createFramebuffer({
  gl,
  width,
  height,
  destroyRef,
  depth = 'renderbuffer',
  color = true,
}: CreateFramebuffer): Framebuffer {
  /**
   * Создание объекта буфера кадра
   * */
  const framebuffer = gl.createFramebuffer();
  /**
   * Определяет тип target объекта буфера кадра framebuffer
   * */
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  // --- цветовое вложение (опционально) ---
  let colorTexture: WebGLTexture | null = null;
  if (color) {
    colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    // последний аргумент null (используется для передачи ссылки на Image)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    /**
     * Присваивает значение param параметру текстуры pname в объекте текстуры с типом target.
     * Параметры:
     * target - может иметь значение gl.TEXTURE_2D или gl.TEXTURE_CUBE_MAP.
     * pname - имя параметра текстуры.
     *  a) gl.TEXTURE_MAG_FILTER - увеличение, по умолчанию gl.LINEAR
     *  б) gl.TEXTURE_MIN_FILTER - уменьшение, по умолчанию gl.NEAREST_MIPMAP_LINEAR
     *  в) gl.TEXTURE_WRAP_S - заполняет по оси S, по умолчанию gl.REPEAT
     *  г) gl.TEXTURE_WRAP_T - заполняет по оси T, по умолчанию gl.REPEAT
     * param - значение параметра с именем pname.
     *  a) gl.LINEAR - использует среднее взвешенное по четырём текселям, ближайшим к центру текстурируемого пикселя.
     *  Этот метод обеспечивает более высокое качество, но требует большего объёма вычислений и, соответственно, времени.
     *  б) gl.NEAREST - использует значение текселя, ближайшего (в смысле алгоритма "Manhattan distance") к центру
     *  текстурируемого пикселя
     *  в) gl.REPEAT - использует изображение текстуры повторно.
     *  г) gl.MIRRORED_REPEAT - использует изображение текстуры повторно с отражением.
     *  д) gl.CLAMP_TO_EDGE - использует цвет края изображения текстуры.
     * */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    /**
     * Подключает объект текстуры texture к объекту буфера кадра с типом target.
     * Параметры:
     * target - должен иметь значение gl.FRAMEBUFFER
     * attachment - определяет точку подключения к буферу кадра
     *  а) gl.COLOR_ATTACHMENT0 - объект texture используется как буфер цвета
     *  б) gl.DEPTH_ATTACHMENT - объект texture используется как буфер глубины
     * textarget - определяет первый аргумент в вызове gl.texImage2D() (gl.TEXTURE_2D или gl.CUBE_MAP_TEXTURE)
     * texture - определяет объект текстуры для подключения к объекту буфера кадра
     * level - должен иметь значение 0 (если объект текстуры texture предусматривает возможность MIP-текстурирования,
     * в аргументе level нужно указать уровень детализации)
     * */
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  } else {
    // framebuffer без цвета: явно говорим, что цветовой вложенности нет (для shadow map) это только в WebGL2
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
  }

  // --- depth-вложение: три режима ---
  let depthRenderbuffer: WebGLRenderbuffer | null = null;
  let depthTexture: WebGLTexture | null = null;

  if (depth === 'renderbuffer') {
    /**
     * Создание depth-renderbuffer - глубина для 3D внутри framebuffer
     * не нужен если картинка 2D, например heatmap
     * */
    // глубина нужна для теста, но читать её не будем => дешёвый renderbuffer
    depthRenderbuffer = gl.createRenderbuffer();
    /**
     * Связать объект depthBuffer с его типом и задать размер
     * */
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
    /**
     * Создаёт и инициализирует хранилище данных для объекта буфера отображения
     * Параметры:
     * target - должен иметь значение gl.RENDERBUFFER
     * internalformat - формат буфера отображения
     *  а) gl.DEPTH_COMPONENT16 - буфер отображения используется как буфер глубины
     *  б) gl.STENCIL_INDEX8 - буфер отображения используется как буфер трафарета
     *  в) gl.RGBA4 - буфер отображения используется как буфер цвета (4 бита)
     *  г) gl.RGBA5_A1 - буфер отображения используется как буфер цвета (5 бит, а для A 1 бит)
     *  д) gl.RGB565 - буфер отображения используется как буфер цвета (5,6,5 бит)
     * width - определяет ширину буфера отображения в пикселях
     * height - определяет высоту буфера отображения в пикселях
     * */
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    /**
     * Подключение объекта depthBuffer к framebuffer
     * */
    /**
     * Подключает объект буфера отображения renderbuffertarget к объекту буфера кадра связанному с типом target.
     * Параметры:
     * target - должен иметь значение gl.FRAMEBUFFER
     * attachment - определяет точку подключения к буферу кадра
     *  а) gl.COLOR_ATTACHMENT0 - renderbuffer используется как буфер цвета
     *  б) gl.DEPTH_ATTACHMENT - renderbuffer используется как буфер глубины
     *  в) gl.STENCIL_ATTACHMENT - renderbuffer используется как буфер трафарета
     * renderbuffertarget - должен иметь значение gl.RENDERBUFFER
     * renderbuffer - объект буфера отображения, подключённый к объекту буфера кадра
     * */
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);
  } else if (depth === 'texture') {
    // глубина в ТЕКСТУРУ => её можно семплить (брать образец) во втором проходе (shadow map)
    depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    // DEPTH_COMPONENT24 для depth-текстуры, точность выше, чтобы сравнение глубин было аккуратным
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    // NEAREST - карту теней НЕ сглаживаем интерполяцией (иначе сравнение глубин поедет)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // за краями карты - не повторять, а зажимать (для отсечения "вне вида света")
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
  }
  // depth === 'none' => ничего не создаём

  // проверка готовности - ловит несовместимые вложения на месте, а не тихим чёрным экраном
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer не готов: 0x${status.toString(16)}`);
  }

  // возвращаем цель на экран и отвязываем ресурсы
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  destroyRef.onDestroy(() => {
    gl.deleteFramebuffer(framebuffer);
    if (colorTexture) gl.deleteTexture(colorTexture);
    if (depthRenderbuffer) gl.deleteRenderbuffer(depthRenderbuffer);
    if (depthTexture) gl.deleteTexture(depthTexture);
  });

  return { framebuffer, colorTexture, depthTexture, width, height };
}
