import { Component, afterNextRender, input, signal } from '@angular/core';

/** A thin progress bar whose fill slides in on load and whenever the value changes. */
@Component({
  selector: 'ft-bar',
  template: `<div class="track"><div class="fill" [style.width.%]="ready() ? pct() : 0" [style.background]="color()"></div></div>`,
  styles: `
    .track { height: 0.5rem; background: var(--line-2); border-radius: 999px; overflow: hidden; }
    .fill { height: 100%; border-radius: 999px; transition: width 1s var(--ease), background 0.3s; }
  `,
})
export class Bar {
  readonly pct = input.required<number>();
  readonly color = input('var(--brand)');
  readonly ready = signal(false);
  constructor() { afterNextRender(() => setTimeout(() => this.ready.set(true), 60)); }
}
