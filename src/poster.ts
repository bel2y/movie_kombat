import { Component, input, signal } from '@angular/core';
import type { Movie } from './battle';

@Component({
  selector: 'movie-poster',
  template: `
    <div class="poster-art" [style.--hue]="movie().id % 360">
      <span>{{ movie().title }}</span>
      @if (movie().poster && failedUrl() !== movie().poster) {
        <img [src]="movie().poster" alt="" (error)="failedUrl.set(movie().poster)">
      }
    </div>
  `,
})
export class Poster {
  readonly movie = input.required<Movie>();
  readonly failedUrl = signal<string | undefined>(undefined);
}
