import { signal, Signal } from '@angular/core';

interface CreateTextureParams {
  gl: WebGL2RenderingContext;
  src: string;
  // UNPACK_FLIP_Y_WEBGL, по умолчанию true
  flipY?: boolean;
  // текстурный слот, по умолчанию 0
  slot?: number;
  // по умолчанию RGB
  internalFormat?: GLenum;
  // по умолчанию RGB
  format?: GLenum;
  // по умолчанию UNSIGNED_BYTE
  type?: GLenum;

  // генерировать мипмапы, по умолчанию false
  generateMipmap?: boolean;
  // по умолчанию зависит от generateMipmap
  minFilter?: GLenum;
  // по умолчанию LINEAR
  magFilter?: GLenum;
  // по умолчанию REPEAT
  wrapS?: GLenum;
  // по умолчанию REPEAT
  wrapT?: GLenum;
}

export function createTexture({
  gl,
  src,
  flipY = true,
  slot = 0,
  internalFormat = gl.RGB,
  format = gl.RGB,
  type = gl.UNSIGNED_BYTE,

  generateMipmap = false,
  minFilter,
  magFilter = gl.LINEAR,
  wrapS = gl.REPEAT,
  wrapT = gl.REPEAT,
}: CreateTextureParams): { texture: WebGLTexture; isReadyTexture: Signal<boolean>; slot: number } {
  /**
   * Создаёт объект текстуры для хранения изображения
   * */
  const texture = gl.createTexture();

  // если минификатор не задан явно — выводим его из generateMipmap:
  // есть мипмапы → трилинейная фильтрация; нет → обычный LINEAR (без мипмапов)
  const resolvedMinFilter = minFilter ?? (generateMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);

  const isReadyTexture = signal(false);

  const image = new Image();
  image.src = src;
  image.onload = () => {
    /**
     * Выполняет операцию, определяемую параметрами pname и param, после загрузки изображения
     * Параметры:
     * pname - может принимать одно из значений:
     *  а) gl.UNPACK_FLIP_Y_WEBGL - поворачивает ось Y изображения. Значение по умолчанию false.
     *  б) gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL - Умножает каждую составляющую цвета в формате RGB на значение
     *  составляющей A (альфа-канала). Значение по умолчанию false.
     * param - Целочисленное ненулевое значение соответствует true, нулевое значение соответствует false.
     * */
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
    /**
     * Выбирает (активизирует) текстурный слот target.
     * Параметры:
     * target - определяет выбираемый текстурный слот gl.TEXTURE[0-7] от нуля до 7. Число в конце имени
     * соответствует порядковому номеру текстурного слота.
     * */
    gl.activeTexture(gl.TEXTURE0 + slot); // слоты идут подряд
    /**
     * Активизирует объект текстуры texture и указывает его тип target. Кроме того, если прежде, вызовом
     * gl.activeTexture(), был активирован текстурный слот, объект текстуры также будет связан с активным слотом.
     * Параметры:
     * target - может иметь значение gl.TEXTURE_2D или gl.TEXTURE_CUBE_MAP.
     * texture - объект текстуры, тип которого требуется указать.
     * */
    gl.bindTexture(gl.TEXTURE_2D, texture);
    /**
     * Присваивает изображение image объекту текстуры с типом target.
     * Параметры:
     * target - может иметь значение gl.TEXTURE_2D или gl.TEXTURE_CUBE_MAP.
     * level - в этом параметре передаётся значение 0 (используется с MIP-текстурами)
     * internalformat - определяет внутренний формат изображения (хранение).
     *  а) gl.RGB - красный, зелёный, синий
     *  б) gl.RGBA - красный, зелёный, синий, альфа-канал
     *  в) gl.ALPHA - 0.0, 0.0, 0.0, 1.0
     *  г) gl.LUMINANCE - L, L, L, 1.0, где L - светимость (воспринимаемая яркость поверхности)
     *  д) gl.LUMINANCE_ALPHA - L, L, L, alpha, где L - светимость (воспринимаемая яркость поверхности)
     * format - определяет формат данных с информацией о текселях (источник).
     * type - определяет тип данных с информацией о текселях
     *  а) gl.UNSIGNED_BYTE - компоненты RGB представлены беззнаковыми байтами - каждый компонент представлен одним байтом
     *  б) gl.UNSIGNED_SHORT_[int]_[int]_[int] - RGB: компоненты представлены [int], [int] и [int] битами, соответственно
     *  для сжатых изображений, чтобы уменьшить время загрузки.
     * */
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, image);

    if (generateMipmap) {
      // в WebGL2 работает и для NPOT-текстур (NPOT = Non-Power-Of-Two «не степень двойки»)
      gl.generateMipmap(gl.TEXTURE_2D);
    }

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
    // Явно прописываем 4 раза для каждой настройки
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, resolvedMinFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

    isReadyTexture.set(true); // готово → компонент перерисует кадр
  };

  return { texture, isReadyTexture, slot };
}
