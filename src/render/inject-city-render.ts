import { afterNextRender, afterRenderEffect, DestroyRef, ElementRef, inject, signal, Signal } from '@angular/core';
import { InstanceData } from '../city/build-instance-data';
import { vec3 } from 'gl-matrix';
import { injectCanvasSize } from './inject-canvas-size';
import { injectOrbitCamera } from '../camera/inject-orbit-camera';
import { createViewProjectionMatrix } from '../shared/math/create-view-projection-matrix';
import { BuildingRenderer, buildingRenderer } from './renderers/building-renderer';
import { surfaceRenderer, SurfaceRenderer } from './renderers/surface-renderer';
import { FlatGeometry } from '../road/build-road-geometry';
import { ShadowRender, shadowRenderer } from './renderers/shadow-renderer';
import { createLightViewProjection } from '../shared/math/create-light-view-projection';
import { Building } from '../city/generate-city.types';
import { lineRenderer, LineRenderer, LineSegment } from './renderers/line-renderer';

interface InjectCityRender {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  instanceData: InstanceData;
  ground: {
    groundGeometry: FlatGeometry;
    groundColor: vec3;
  };
  road: {
    roadGeometry: FlatGeometry;
    roadColor: vec3;
  };
  // направление НА свет (нормализованное)
  lightDirection: Signal<vec3>;
  // радиус охватывающий сферы города - под ортобокс карты теней (уже не надо, но пока оставлю, мало ли понадобиться)
  sceneRadius: number;
  selectedBuilding: Signal<Building | null>;
  activeLineSegment: Signal<LineSegment | null>;
  // подсветка выбранного здания
  isHighlightBuild: Signal<boolean>;
}

// Тень следует за каерой: охват = дистанция зума * фактор, зажатый в разумные пределы.
const SHADOW_RADIUS_FACTOR = 1; // доля видимой области, попадающая в резкую тень
const MIN_SHADOW_RADIUS = 150; // не мельче - иначе высокие дома у края теряют тень по верху

export function injectCityRender({
  canvasRef,
  instanceData,
  ground: { groundGeometry, groundColor },
  road: { roadGeometry, roadColor },
  // солнце сверху-сбоку по умолчанию (направление НА свет), нормализуем
  lightDirection,
  selectedBuilding,
  activeLineSegment,
  isHighlightBuild,
}: InjectCityRender) {
  const size = injectCanvasSize({ canvasRef });
  const castShadows = signal(true);
  const destroyRef = inject(DestroyRef);

  // Камера под масштаб города (~1450 м): initialEye задаёт радиус (~2780 м) и 3/4-ракурс сверху
  const {
    viewMatrix,
    center: cameraCenter,
    distance: cameraDistance,
    eyePoint,
  } = injectOrbitCamera({
    canvasRef,
    initialEye: vec3.fromValues(1500, 1800, 1500),
  });
  // near/far под масштаб города: ближайшее здание дальше ~1700 м, поэтому near можно поднять - меньше z-fighting
  const viewProjection = createViewProjectionMatrix({ canvasRef, viewMatrix, near: 10, far: 10000 });

  let gl: WebGL2RenderingContext | null = null;
  let buildings: BuildingRenderer | null = null;
  let surface: SurfaceRenderer | null = null;
  let shadow: ShadowRender | null = null;
  let line: LineRenderer | null = null;

  // ОДИН РАЗ: контекст, программа, рендеры (здания, поверхности) и depth-проход теней
  afterNextRender({
    write: () => {
      const context = canvasRef().nativeElement.getContext('webgl2');
      if (!context) throw new Error('WebGL2 не поддерживается этим браузером');
      gl = context;

      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.53, 0.7, 0.87, 1); // небесный фон

      buildings = buildingRenderer({ gl, instanceData });
      surface = surfaceRenderer({
        gl,
        surfaces: [
          {
            geometry: groundGeometry,
            color: groundColor,
          },
          {
            geometry: roadGeometry,
            color: roadColor,
          },
        ],
      });
      shadow = shadowRenderer({ gl, instanceData, destroyRef, size: 4096 });
      line = lineRenderer({ gl });

      destroyRef.onDestroy(() => {
        buildings?.dispose();
        surface?.dispose();
        shadow?.dispose();
        line?.dispose();
      });

      render(); // первый кадр сразу
    },
  });

  // Реактивно: перерисовка при изменении размера, вращении, направления света
  afterRenderEffect({
    write: () => render(),
  });

  function render() {
    if (!gl || !buildings || !surface || !shadow || !line) return;

    const { width, height } = size();
    const canvas = canvasRef().nativeElement;
    // трогаем буфер только при реальном изменении размера
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const camera = viewProjection();
    const light = lightDirection();
    // Тень привязана к камере: центр - куда смотрим, охват по зуму (чем ближе, тем резче)
    const shadowRadius = Math.max(MIN_SHADOW_RADIUS, cameraDistance() * SHADOW_RADIUS_FACTOR);
    const lightViewProjection = createLightViewProjection({
      lightDirection: light,
      center: cameraCenter(),
      radius: shadowRadius,
    });

    if (castShadows()) {
      // ПРОХОД 1: глубина города в карту теней (свой viewport и framebuffer внутри)
      shadow.renderDepth({ lightViewProjection });
    } else {
      shadow.clear(); // пустая карта => сцена без теней
    }

    // ПРОХОД 2: сцена на экран. Карту теней кладём на текстурный юнит 0 - материалы её не семплят
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadow.depthTexture);

    surface.draw({ viewProjection: camera, lightViewProjection }); // трава + дороги принимаю тень
    const selectedId = isHighlightBuild() ? (selectedBuilding()?.id ?? -1) : -1;
    buildings.draw({
      viewProjection: camera,
      lightDirection: light,
      lightViewProjection,
      selectedId,
    });
    // Измерительная линия - поверх всего
    line.draw({ viewProjection: camera, eye: eyePoint(), lineSegment: activeLineSegment() });
  }

  return { lightDirection, castShadows, viewProjection, eyePoint, size };
}
