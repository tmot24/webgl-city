import { computed, ElementRef, Injectable, signal, Signal } from '@angular/core';
import { mat4 } from 'gl-matrix';
import { CanvasSize } from '@webgl-city/core/dom/observe-canvas-size';
import { createScreenProjector, ScreenProjector } from '@webgl-city/core/ray/create-screen-projector';

interface ViewportSource {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: () => mat4;
  size: Signal<CanvasSize>;
}

/**
 * Камера + canvas сцены для UI-оверлея: проекция мир => экран.
 * Не стор - это не доменное состояние, а доступ к рендеру. Живёт в Providers Scene.
 * */
@Injectable()
export class SceneViewport {
  private readonly source = signal<ViewportSource | null>(null);

  connect(source: ViewportSource) {
    this.source.set(source);
  }

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
