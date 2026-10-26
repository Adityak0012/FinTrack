import { Component, ElementRef, OnDestroy, effect, inject, input, signal } from '@angular/core';
import { animate } from 'motion';
import { money } from '../core/format';

/** A number that counts up to its value (and between values) with an ease-out curve. */
@Component({
  selector: 'ft-amount',
  template: `{{ text() }}`,
  host: { class: 'num' },
})
export class Amount implements OnDestroy {
  readonly value = input.required<number>();
  readonly decimals = input(false);
  readonly duration = input(1.1);
  readonly text = signal('₹0');
  private current = 0;
  private ctrl?: { stop: () => void };
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    effect(() => {
      const to = this.value();
      const dec = this.decimals();
      this.ctrl?.stop();
      if (this.reduced || !Number.isFinite(to)) { this.current = to; this.text.set(money(to, dec)); return; }
      this.ctrl = animate(this.current, to, {
        duration: this.duration(),
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v: number) => { this.current = v; this.text.set(money(dec ? v : Math.round(v), dec)); },
        onComplete: () => { this.current = to; this.text.set(money(to, dec)); },
      }) as unknown as { stop: () => void };
    });
  }
  ngOnDestroy(): void { this.ctrl?.stop(); void this.el; }
}
