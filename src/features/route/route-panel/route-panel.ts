import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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
  readonly info = input<RouteInfo | null>(null);
  readonly awaitingSecond = input<boolean>(false);
  readonly reset = output<void>();
}
