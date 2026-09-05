import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FpsCounter } from './fps-counter/fps-counter';

@Component({
  imports: [RouterOutlet, FpsCounter],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('webgl-city');
}
