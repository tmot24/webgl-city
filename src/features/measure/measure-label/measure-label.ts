import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
  readonly label = input<MeasureLabelData | null>();
}
