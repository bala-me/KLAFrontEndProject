import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FishboneComponent } from "./fishbone-component/fishbone-component";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FishboneComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  protected readonly title = signal('Ishikawa');
}
