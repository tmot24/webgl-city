import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SCENE_MODES } from '@webgl-city/core/scene/scene-mode';
import { SceneModStore } from '../scene-mod.store';

@Component({
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mode-toolbar',
  templateUrl: './mode-toolbar.html',
})
export class ModeToolbar {
  protected readonly modes = SCENE_MODES;
  protected readonly store = inject(SceneModStore);
}
