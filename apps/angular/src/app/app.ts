import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FpsCounter } from './fps-counter/fps-counter';

@Component({
  imports: [RouterOutlet, FpsCounter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.html',
  host: { class: 'app' },
})
export class App {
  protected readonly title = signal('webgl-city');
}
