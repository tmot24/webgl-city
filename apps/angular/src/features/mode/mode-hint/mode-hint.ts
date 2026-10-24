import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MODE_HINTS } from '../scene-mode';
import { SceneModStore } from '../scene-mod.store';

@Component({
  imports: [],
  selector: 'app-mode-hint',
  styleUrl: './mode-hint.css',
  templateUrl: './mode-hint.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeHint {
  protected readonly store = inject(SceneModStore);
  protected readonly text = computed(() => MODE_HINTS[this.store.mode()]);
}
