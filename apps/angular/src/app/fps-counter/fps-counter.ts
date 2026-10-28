import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { fpsColor } from '@webgl-city/core/diagnostics/fps-color';
import { observeFps } from '@webgl-city/core/diagnostics/observe-fps';

@Component({
  imports: [],
  selector: 'app-fps-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fps-counter.html',
})
export class FpsCounter {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fps = signal(0);
  protected readonly color = computed(() => fpsColor({ fps: this.fps() }));

  constructor() {
    afterNextRender(() => {
      const stop = observeFps({ onSample: ({ fps }) => this.fps.set(fps) });
      this.destroyRef.onDestroy(stop);
    });
  }
}
