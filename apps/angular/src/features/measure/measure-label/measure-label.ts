import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MeasureStore } from '../measure.store';
import { SceneViewport } from '../../../render/scene-viewport';
import { injectScreenOverlay } from '../../../render/inject-screen-overlay';
import { toMeasureLabel } from '@webgl-city/core/measure/measurement';

@Component({
  imports: [],
  selector: 'app-measure-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // шаблона нет: элемент метки - сам host, им управляет injectScreenOverlay
  template: '',
  host: { class: 'measure-label', hidden: '' },
})
// Подпись длины над серединой отрезка
export class MeasureLabel {
  constructor() {
    const store = inject(MeasureStore);
    const viewport = inject(SceneViewport);

    injectScreenOverlay({
      read: () => {
        const segment = store.segment();
        const project = viewport.project();
        return segment && project ? toMeasureLabel({ segment, project }) : null;
      },
    });
  }
}
