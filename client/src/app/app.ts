import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts],
  template: `<router-outlet /><ft-toasts />`,
  host: { '(document:pointermove)': 'track($event)' },
})
export class App {
  /** Moves the soft blue spotlight on whichever card the pointer is over. */
  track(e: PointerEvent): void {
    const card = (e.target as HTMLElement | null)?.closest?.('.card') as HTMLElement | null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
}
