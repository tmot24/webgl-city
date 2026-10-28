import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MeasureStore } from '../measure.store';
import { SceneViewport } from '../../../render/scene-viewport';
import { injectScreenOverlay } from '../../../render/inject-screen-overlay';

@Component({
  imports: [],
  selector: 'app-snap-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { class: 'snap-marker', hidden: '' },
})
// Маркер залипания: кружок в точке, к которой прилипнет клик
export class SnapMarker {
  constructor() {
    const store = inject(MeasureStore);
    const viewport = inject(SceneViewport);

    injectScreenOverlay({
      read: () => {
        const point = store.snapPoint();
        const project = viewport.project();
        return point && project ? project({ point }) : null;
      },
    });
  }
}
