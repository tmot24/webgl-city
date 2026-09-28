import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouteStore } from '../route.store';

export interface RouteInfo {
  length: string;
  crossings: number;
}

@Component({
  imports: [],
  selector: 'app-route-panel',
  styleUrl: './route-panel.css',
  templateUrl: './route-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutePanel {
  protected readonly store = inject(RouteStore);
}
