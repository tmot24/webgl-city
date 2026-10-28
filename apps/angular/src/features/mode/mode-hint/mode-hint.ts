import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MODE_HINTS } from '@webgl-city/core/scene/scene-mode';
import { SceneModeStore } from '../scene-mode.store';

@Component({
  imports: [],
  selector: 'app-mode-hint',
  templateUrl: './mode-hint.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeHint {
  protected readonly store = inject(SceneModeStore);
  protected readonly text = computed(() => MODE_HINTS[this.store.mode()]);
}
