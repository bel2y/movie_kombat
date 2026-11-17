import { Component, ElementRef, HostListener, inject, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { battle } from './battle';
import type { BattleResult, Movie } from './battle';
import { demoLists } from './movies';
import { Poster } from './poster';

type Scene = 'home' | 'intro' | 'roulette' | 'versus' | 'winner' | 'result' | 'lists' | 'history';
const storageKey = 'movie-kombat.history.v1';

function historyFromStorage(): BattleResult[] {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(data) ? data.filter(item => item?.left?.movie?.title && item?.right?.movie?.title && ['left', 'right'].includes(item.winner)) : [];
  } catch {
    return [];
  }
}

function reel(movies: Movie[], finish: Movie): Movie[] {
  const start = movies.indexOf(finish) + 1;
  return Array.from({ length: 21 }, (_, index) => index === 20 ? finish : movies[(start + index) % movies.length]);
}

@Component({
  selector: 'movie-arena',
  imports: [Poster],
  templateUrl: './arena.html',
})
class Arena {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly lists = demoLists;
  readonly names = ['Игрок 1', 'Игрок 2'];
  readonly scene = signal<Scene>('home');
  readonly result = signal<BattleResult | null>(null);
  readonly history = signal(historyFromStorage());
  readonly muted = signal(false);
  readonly listIndex = signal(0);
  private audio?: AudioContext;
  private timers: number[] = [];
  reels: Movie[][] = [];

  get playing(): boolean {
    return ['intro', 'roulette', 'versus', 'winner'].includes(this.scene());
  }

  start(): void {
    if (this.playing) return;
    const result = battle(...this.lists);
    if (!result) return;
    this.result.set(result);
    this.reels = [reel(this.lists[0], result.left.movie), reel(this.lists[1], result.right.movie)];
    this.history.update(items => [result, ...items].slice(0, 100));
    try { localStorage.setItem(storageKey, JSON.stringify(this.history())); } catch { /* Storage may be disabled. */ }
    this.show('intro');
    this.sound([130, 196]);
    this.timers = [
      window.setTimeout(() => this.show('roulette'), 2000),
      window.setTimeout(() => { this.show('versus'); this.sound([196, 233, 294]); }, 7000),
      window.setTimeout(() => { this.show('winner'); this.sound([262, 330, 392, 523]); }, 10000),
      window.setTimeout(() => this.show('result'), 13000),
    ];
  }

  show(scene: Scene): void {
    this.scene.set(scene);
    requestAnimationFrame(() => this.host.nativeElement.querySelector<HTMLElement>('[data-initial]')?.focus());
  }

  skip(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
    this.audio?.suspend().catch(() => {});
    this.show('result');
  }

  toggleSound(): void {
    this.muted.update(value => !value);
    if (this.muted()) this.audio?.suspend().catch(() => {});
  }

  private sound(notes: number[]): void {
    if (this.muted()) return;
    try {
      this.audio ??= new AudioContext();
      const audio = this.audio;
      void audio.resume().catch(() => {});
      notes.forEach((note, index) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const time = audio.currentTime + index * .12;
        osc.type = 'triangle';
        osc.frequency.value = note;
        gain.gain.setValueAtTime(.001, time);
        gain.gain.exponentialRampToValueAtTime(.12, time + .03);
        gain.gain.exponentialRampToValueAtTime(.001, time + .37);
        osc.connect(gain).connect(audio.destination);
        osc.start(time);
        osc.stop(time + .38);
      });
    } catch { /* Playback remains optional on unsupported browsers. */ }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const key = event.key;
    if (key === 'Escape' || key === 'Backspace' || key === 'BrowserBack' || event.keyCode === 461) {
      event.preventDefault();
      if (this.playing) this.skip();
      else if (this.scene() !== 'home') this.show('home');
      return;
    }
    if ((key === 'Enter' || event.keyCode === 13) && this.playing) {
      event.preventDefault();
      if (!event.repeat) this.skip();
      return;
    }
    if (event.repeat && key === 'Enter') {
      event.preventDefault();
      return;
    }
    const direction: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const vector = direction[key];
    if (!vector) return;
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(button => button.getClientRects().length > 0);
    const active = document.activeElement;
    const center = (el: Element) => {
      const rect = el.getBoundingClientRect();
      return [rect.x + rect.width / 2, rect.y + rect.height / 2];
    };
    if (!active || !this.host.nativeElement.contains(active)) {
      this.host.nativeElement.querySelector<HTMLElement>('[data-initial]')?.focus();
      event.preventDefault();
      return;
    }
    const [x, y] = center(active);
    const [dx, dy] = vector;
    let best: HTMLButtonElement | undefined;
    let score = Infinity;
    for (const button of buttons) {
      const [bx, by] = center(button);
      const forward = dx * (bx - x) + dy * (by - y);
      if (forward <= 1) continue;
      const distance = forward + 2 * Math.abs(dx * (by - y) + dy * (bx - x));
      if (distance < score) { best = button; score = distance; }
    }
    if (best) { event.preventDefault(); best.focus(); }
  }
}
bootstrapApplication(Arena, { providers: [provideZonelessChangeDetection()] }).then(app => {
  app.components[0].location.nativeElement.querySelector('[data-initial]')?.focus();
}).catch(console.error);

