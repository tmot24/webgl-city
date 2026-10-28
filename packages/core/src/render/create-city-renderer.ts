import { FlatGeometry } from '../city/road/construct-road-geometry';
import { mat4, vec3 } from 'gl-matrix';
import { CanvasSize } from '../dom/observe-canvas-size';
import { InstanceData } from '../city/build-instance-data';
import { constructCubeGeometry } from '../geometry/construct-cube-geometry';
import { createBuildingRenderer } from './create-building-renderer';
import { createSurfaceRenderer } from './create-surface-renderer';
import { createShadowRenderer } from './create-shadow-renderer';
import { createLineRenderer } from './create-line-renderer';
import { createLightViewProjection } from '../math/create-light-view-projection';

export interface CitySurface {
  geometry: FlatGeometry;
  color: vec3;
}

/**
 * Всё, что нужно для одного кадра. Рендерер не хранит состояние сцены:
 * адаптер фреймворка собирает кадр из своих реактивных данных и вызывает render.
 * */
export interface CityFrame {
  // размер буфера рисования в device-пикселях
  size: CanvasSize;
  camera: {
    viewProjection: mat4;
    eye: vec3;
    // центр орбиты и дистанция - к ним направлена карта теней
    center: vec3;
    distance: number;
  };
  light: {
    // направление НА свет (нормализованное)
    directionNorm: vec3;
    castShadows: boolean;
  };
  // id подсвечиваемого здания, -1 - без подсветки
  selectedId: number;
  // измерительная линия / маршрут поверх сцены
  polyline: vec3[] | null;
}

export interface CityRenderer {
  render: (frame: CityFrame) => void;
  dispose: () => void;
}

interface CreateCityRenderer {
  canvas: HTMLCanvasElement;
  instanceData: InstanceData;
  ground: CitySurface;
  road: CitySurface;
  // разрешение карты теней (степень двойки)
  shadowMapSize?: number;
}

// Тень следует за камерой: охват = дистанция зума * фактор, зажатый снизу
const SHADOW_RADIUS_FACTOR = 1; // доля видимой области, попадающая в резкую тень
const MIN_SHADOW_RADIUS = 150; // не мельче - иначе высокие дома у края теряют тень по верху

/**
 * Рендер города: контекст, GL-ресурсы и двухпроходная отрисовка (тени => сцена).
 * Ресурсы создаются один раз при вызове, освобождаются в dispose.
 * */
export function createCityRenderer({
  canvas,
  instanceData,
  ground,
  road,
  shadowMapSize = 4096,
}: CreateCityRenderer): CityRenderer {
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 не поддерживается этим браузером');

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.53, 0.7, 0.87, 1); // небесный фон

  const cubeGeometry = constructCubeGeometry();

  const buildings = createBuildingRenderer({ gl, instanceData, cubeGeometry });
  const surface = createSurfaceRenderer({ gl, surfaces: [ground, road] });
  const shadow = createShadowRenderer({ gl, instanceData, cubeGeometry, size: shadowMapSize });
  const line = createLineRenderer({ gl });

  const render = ({ size, camera, light, selectedId, polyline }: CityFrame) => {
    const { width, height } = size;
    // трогаем буфер только при реальном изменении размера (присваивание очищает canvas)
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    // Тень привязана к камере: центр - куда смотрим, охват по зуму (чем ближе, тем резче)
    const lightViewProjection = createLightViewProjection({
      lightDirection: light.directionNorm,
      center: camera.center,
      radius: Math.max(MIN_SHADOW_RADIUS, camera.distance * SHADOW_RADIUS_FACTOR),
    });

    if (light.castShadows) {
      // ПРОХОД 1: глубина города в карту теней (свой viewport и framebuffer внутри)
      shadow.renderDepth({ lightViewProjection });
    } else {
      shadow.clear(); // пустая карта => сцена без теней
    }

    // ПРОХОД 2: сцена на экран. Карту теней кладём на текстурный юнит 0
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadow.depthTexture);

    surface.draw({ viewProjection: camera.viewProjection, lightViewProjection }); // трава + дороги принимают тень
    buildings.draw({
      viewProjection: camera.viewProjection,
      lightDirection: light.directionNorm,
      lightViewProjection,
      selectedId,
    });
    // Измерительная линия / маршрут - поверх всего
    line.draw({ viewProjection: camera.viewProjection, eye: camera.eye, points: polyline });
  };

  const dispose = () => {
    buildings.dispose();
    surface.dispose();
    shadow.dispose();
    line.dispose();
  };

  return { render, dispose };
}
