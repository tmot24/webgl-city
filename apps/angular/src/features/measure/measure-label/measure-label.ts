import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectMeasureOverlay } from '../inject-measure-overlay';

@Component({
  imports: [],
  selector: 'app-measure-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './measure-label.html',
})
export class MeasureLabel {
  protected readonly overlay = injectMeasureOverlay();
}
