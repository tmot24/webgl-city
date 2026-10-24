import { ElementRef, Injectable, signal, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { CanvasSize } from './inject-canvas-size';
import { ScreenPoint, worldToScreen } from '../shared/ray/world-to-screen';

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

  // Проекция
  // Мир => CSS-пиксели canvas. Реактивно (камера, ресайз), если читать внутри computed,
  // null - viewport ещё не подключён или точка за камерой
  project({ point }: { point: vec3 }): ScreenPoint | null {
    const source = this.source();
    if (!source) return null;

    source.size(); // зависимость: пересчёт при ресайзе (значение из clientWidth)
    const canvas = source.canvasRef().nativeElement;
    return worldToScreen({
      point,
      viewProjection: source.viewProjection(),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  }
}
