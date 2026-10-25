import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouteStore } from '../route.store';

@Component({
  imports: [],
  selector: 'app-route-panel',
  templateUrl: './route-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutePanel {
  protected readonly store = inject(RouteStore);
}
