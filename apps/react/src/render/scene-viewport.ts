import { OrbitCamera } from '../camera/orbit-camera';
import { CITY_CAMERA } from '@webgl-city/core/city/city-default';
import { CanvasSize } from '@webgl-city/core/dom/observe-canvas-size';
import { makeAutoObservable, observableRef } from 'mobx';
import { createViewProjectionMatrix } from '@webgl-city/core/math/create-view-projection-matrix';
import { createScreenProjector, ScreenProjector } from '@webgl-city/core/ray/create-screen-projector';

/**
 * Камера + размер canvas сцены. Не доменный стор - доступ к рендеру.
 * Создаётся один раз на экземпляр Scene.
 * */
export class SceneViewport {
  readonly camera = new OrbitCamera({ initialEye: CITY_CAMERA.initialEye });
  // Canvas сцены: нужен указателю (лучи) и оверлею (размер в CSS-пикселях)
  canvas: HTMLCanvasElement | null = null;
  // Размер буфера рисования (стандартный 300 на 150) в device-пикселях
  size: CanvasSize = { width: 300, height: 150 };

  constructor() {
    makeAutoObservable(
      this,
      // camera: false - здесь не потому, что камера не реактивна, а потому, что она сама MobX-store;
      // ссылка на неё не меняется, а её поля MobX и так отслеживает, иначе MobX попытался бы сделать observable уже observable объект
      { camera: false, size: observableRef, canvas: observableRef },
      // autoBind: методы можно передавать как callback (onRotate: camera.rotate)
      { autoBind: true },
    );
  }

  attachCanvas({ canvas }: { canvas: HTMLCanvasElement | null }) {
    this.canvas = canvas;
  }

  setSize(size: CanvasSize) {
    // Новый объект с теми же числами - не изменение: не трогаем ссылку, чтобы не будить computed и рендер
    if (size.width === this.size.width && size.height === this.size.height) return;
    this.size = size;
  }

  // Аспект - из размера буфера: пересчёт при ресайзе и движении камеры
  get viewProjection() {
    const { width, height } = this.size;
    return createViewProjectionMatrix({
      aspect: width / height,
      viewMatrix: this.camera.viewMatrix,
      near: CITY_CAMERA.near,
      far: CITY_CAMERA.far,
    });
  }

  // Мир => CSS-пиксели canvas. Пересоздаётся при движении камеры и ресайзе
  get projector(): ScreenProjector | null {
    const { canvas } = this;
    if (!canvas) return null;

    return createScreenProjector({
      viewProjection: this.viewProjection,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  }
}
