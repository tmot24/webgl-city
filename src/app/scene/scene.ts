import {
  afterNextRender,
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { injectCanvasSize } from '../../inject/inject-canvas-size';

@Component({
  imports: [],
  selector: 'app-scene',
  styleUrl: './scene.css',
  templateUrl: './scene.html',
})
export class Scene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly size = injectCanvasSize({ canvasRef: this.canvasRef });
  private readonly destroyRef = inject(DestroyRef);

  private gl: WebGL2RenderingContext | null = null;

  constructor() {
    // ОДИН РАЗ: получаем контекст WebGL2 после появления canvas в DOM
    afterNextRender({
      write: () => {
        const gl = this.canvasRef().nativeElement.getContext('webgl2');
        if (!gl) throw new Error('WebGL2 не поддерживается этим браузером');
        this.gl = gl;
        gl.clearColor(0, 0, 0, 0.5);
        this.draw(); // первый кадр сразу, без ожидания ресайза
        this.destroyRef.onDestroy(() => gl.getExtension('WEBGL_lose_context')?.loseContext());
      },
    });

    // Реактивно: перерисовка при изменении размера (draw() читает size())
    afterRenderEffect({
      write: () => this.draw(),
    });
  }

  // Синхронизируем буфер с размером и заливаем фоном.
  private draw() {
    const gl = this.gl;
    if (!gl) return;

    const { width, height } = this.size();
    const canvas = this.canvasRef().nativeElement;
    // трогаем буфер только при реальном изменении размера
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
