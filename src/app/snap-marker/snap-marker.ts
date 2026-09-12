import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScreenPoint } from '../../helper/hit-box/world-to-screen';

@Component({
  imports: [],
  selector: 'app-snap-marker',
  styleUrl: './snap-marker.css',
  templateUrl: './snap-marker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Маркер залипания: кружок в точке, к которой прилипнет клик
export class SnapMarker {
  readonly position = input<ScreenPoint | null>(null);
}
