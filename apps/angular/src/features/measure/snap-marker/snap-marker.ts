import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectMeasureOverlay } from '../inject-measure-overlay';

@Component({
  imports: [],
  selector: 'app-snap-marker',
  styleUrl: './snap-marker.css',
  templateUrl: './snap-marker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Маркер залипания: кружок в точке, к которой прилипнет клик
export class SnapMarker {
  protected readonly overlay = injectMeasureOverlay();
}
