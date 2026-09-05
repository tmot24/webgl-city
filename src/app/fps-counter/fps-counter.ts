import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { runAnimationFrame } from '../../helper/core/run-animation-frame';

@Component({
  imports: [],
  selector: 'app-fps-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './fps-counter.css',
  templateUrl: './fps-counter.html',
})
export class FpsCounter {
  private readonly destroyRef = inject(DestroyRef);
  private readonly SAMPLE_MS = 500;

  protected readonly fps = signal(0);
  protected readonly color = computed(() => {
    const value = this.fps();
    if (value >= 55) return '#7ddc7d';
    if (value >= 30) return '#e6c04d';
    return '#e06d6d';
  });

  constructor() {
    afterNextRender(() => {
      let frames = 0;
      let elapsed = 0;

      runAnimationFrame({
        destroyRef: this.destroyRef,
        onFrame: ({ delta }) => {
          frames++;
          elapsed += delta;
          if (elapsed >= this.SAMPLE_MS) {
            this.fps.set(Math.round((frames * 1000) / elapsed)); // Кадров в секунду за окно
            frames = 0;
            elapsed = 0;
          }
        },
      });
    });
  }
}
