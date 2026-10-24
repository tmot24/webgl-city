import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectMeasureOverlay } from '../inject-measure-overlay';

// css пиксели
export interface MeasureLabelData {
  x: number;
  y: number;
  text: string;
}

@Component({
  imports: [],
  selector: 'app-measure-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './measure-label.css',
  templateUrl: './measure-label.html',
})
export class MeasureLabel {
  protected readonly overlay = injectMeasureOverlay();
}
