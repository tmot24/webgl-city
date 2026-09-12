import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MODE_HINTS, SceneMode } from '../scene-mode';

@Component({
  imports: [],
  selector: 'app-mode-hint',
  styleUrl: './mode-hint.css',
  templateUrl: './mode-hint.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeHint {
  readonly mode = input.required<SceneMode>();
  protected readonly text = computed(() => MODE_HINTS[this.mode()]);
}
