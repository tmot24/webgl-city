import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { SCENE_MODES, SceneMode } from './scene-mode';

@Component({
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mode-toolbar',
  styleUrl: './mode-toolbar.css',
  templateUrl: './mode-toolbar.html',
})
export class ModeToolbar {
  readonly modes = SCENE_MODES;
  readonly mode = model.required<SceneMode>(); // двусторонняя связанность
}
