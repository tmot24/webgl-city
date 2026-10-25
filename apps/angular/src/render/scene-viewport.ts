import { computed, ElementRef, Injectable, signal, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { CanvasSize } from '@webgl-city/core/dom/observe-canvas-size';
import { createScreenProjector, ScreenProjector } from '@webgl-city/core/ray/create-screen-projector';

interface ViewportSource {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: Signal<mat4>;
  eyePoint: Signal<vec3>;
  size: Signal<CanvasSize>;
}

/**
 * Камера + canvas сцены для фич: лучи из камеры, проекция мир => экран.
 * Не стор - это не доменное состояние, а доступ к рендеру. Живёт в providers Scene,
 * подключается в injectCityRender (там создаётся камера)
 * */
@Injectable()
export class SceneViewport {
  private readonly source = signal<ViewportSource | null>(null);

  connect(source: ViewportSource) {
    this.source.set(source);
  }

  private required(): ViewportSource {
    const source = this.source();
    if (!source) throw new Error('SceneViewport не подключён: injectCityRender должен вызываться раньше фич');
    return source;
  }

  readonly canvas = () => this.required().canvasRef().nativeElement;
  readonly viewProjection = () => this.required().viewProjection();
  readonly eyePoint = () => this.required().eyePoint();

  // Пересоздаётся при движении камеры и ресайзе; null - viewport ещё не подключён
  readonly project = computed((): ScreenProjector | null => {
    const source = this.source();
    if (!source) return null;

    source.size(); // зависимость: пересчёт при ресайзе (значение из clientWidth)
    const canvas = source.canvasRef().nativeElement;

    return createScreenProjector({
      viewProjection: source.viewProjection(),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  });
}
