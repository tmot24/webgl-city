import { afterNextRender, afterRenderEffect, DestroyRef, ElementRef, inject, Signal } from '@angular/core';
import { injectCanvasSize } from './inject-canvas-size';
import { createGLProgram } from '../helper/core/create-gl-program';
import { runAnimationFrame } from '../helper/core/run-animation-frame';

interface InjectWebglRender<TSetup> {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  vertex: string;
  fragment: string;
  animate?: boolean; // Непрерывный rAF-цикл (requestAnimationFrame) вместо реакции на сигнал
  // одноразовая настройка после создания программы (буферы, локации и т.п.)
  setup: (params: { gl: WebGL2RenderingContext; program: WebGLProgram; destroyRef: DestroyRef }) => TSetup;
  // кадр: реактивный (ресайз + любой сигнал, прочитанный внутри)
  render: (params: {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    width: number;
    height: number;
    setup: TSetup;
    time: number; // мс с начала анимации (0 в реактивном режиме)
    delta: number; // мс с прошлого кадра (0 в реактивном режиме)
  }) => void;
}

export function injectWebGLRender<TSetup = Record<string, never>>({
  canvasRef,
  vertex,
  fragment,
  animate = false,
  setup,
  render,
}: InjectWebglRender<TSetup>) {
  const size = injectCanvasSize({ canvasRef });
  const destroyRef = inject(DestroyRef);

  let gl: WebGL2RenderingContext | null;
  let program: WebGLProgram | null;
  let setupResult: TSetup;

  // общий "нарисовать кадр", синхронизация буфера + viewport + clear + render
  const draw = ({
    gl,
    program,
    width,
    height,
    time = 0,
    delta = 0,
  }: {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    width: number;
    height: number;
    time?: number;
    delta?: number;
  }) => {
    const canvas = canvasRef().nativeElement;
    // меняем буфер только при реальном изменении размера
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    // viewport почти всегда должен совпадать с буфером
    gl.viewport(0, 0, width, height);
    // Очистить canvas. Без этой операции каждый последующий кадр будет отображать остатки предыдущего кадра,
    // что может привести к визуальным артефактам и ошибкам рендеринга.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // цвет + глубина одной маской

    render({ gl, program, width, height, setup: setupResult, time, delta });
  };

  // ОДИН РАЗ: контекст, программа, пользовательский setup, регистрация очистки
  afterNextRender({
    write: () => {
      const context = canvasRef().nativeElement.getContext('webgl2');
      if (!context) throw new Error('WebGL2 не поддерживается');
      gl = context;

      const prog = createGLProgram({ gl, vertex, fragment });
      if (!prog) throw new Error('Не удалось создать программу');
      program = prog;
      gl.useProgram(program);
      // Устанавливает цвет в COLOR_BUFFER_BIT для очистки (заливки) области рисования.
      // То есть сперва указываем (один раз), а при очистке ссылаемся на этот цвет
      gl.clearColor(0, 0, 0, 0.5);

      // Активирует буфер глубины
      gl.enable(gl.DEPTH_TEST);

      setupResult = setup({ gl, program, destroyRef });

      destroyRef.onDestroy(() => gl?.deleteProgram(program));

      if (animate) {
        runAnimationFrame({
          destroyRef,
          onFrame: ({ time, delta }) => {
            const { width, height } = size();
            draw({ gl: context, program: prog, width, height, time, delta });
          },
        });
      }
    },
  });

  // РЕАКТИВНО (только без animate): перерисовка по сигналам (size + всё, что читает render)
  if (!animate) {
    afterRenderEffect({
      write: () => {
        const { width, height } = size(); // зависимость => перерисовка на ресайз
        if (!gl || !program) return; // setup ещё не отработал (защита)
        draw({ gl, program, width, height });
      },
    });
  }
}
