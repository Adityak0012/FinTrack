import { Component, ElementRef, afterRenderEffect, computed, input, signal, viewChild } from '@angular/core';
import { animate } from 'motion';
import { money } from '../core/format';

export interface Slice { key: string; label: string; value: number; color: string; }

const R = 78;
const C = 2 * Math.PI * R;
const GAP = 3;

/** Animated donut chart drawn with SVG. Hover a slice (or its legend row) to see its share. */
@Component({
  selector: 'ft-donut',
  template: `
    <div class="wrap">
      <svg #svg viewBox="0 0 200 200" role="img" [attr.aria-label]="'Spending by category, total ' + fmt(total())">
        <circle cx="100" cy="100" [attr.r]="r" fill="none" stroke="#ecece9" stroke-width="22" />
        @for (s of segs(); track s.key; let i = $index) {
          <circle class="seg" cx="100" cy="100" [attr.r]="r" fill="none" [attr.stroke]="s.color" stroke-width="22" stroke-linecap="butt"
                  [attr.data-len]="s.len" [style.transform]="'rotate(' + s.rot + 'deg)'" [style.opacity]="active() === null || active() === i ? 1 : 0.28"
                  (mouseenter)="active.set(i)" (mouseleave)="active.set(null)" (focus)="active.set(i)" (blur)="active.set(null)" tabindex="0" [attr.aria-label]="s.label + ' ' + fmt(s.value)" />
        }
      </svg>
      <div class="center">
        @if (hovered(); as h) {
          <span class="c-label">{{ h.label }}</span>
          <span class="c-value serif">{{ fmt(h.value) }}</span>
          <span class="c-sub">{{ share(h.value) }}% of spending</span>
        } @else {
          <span class="c-label">Total spent</span>
          <span class="c-value serif">{{ fmt(total()) }}</span>
          <span class="c-sub">{{ data().length }} {{ data().length === 1 ? 'category' : 'categories' }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .wrap { position: relative; width: 100%; max-width: 15rem; margin: 0 auto; aspect-ratio: 1; }
    svg { width: 100%; height: 100%; overflow: visible; }
    .seg { transform-origin: 100px 100px; transform-box: view-box; transition: opacity 0.25s, stroke-width 0.25s; cursor: pointer; outline: none; }
    .seg:hover, .seg:focus-visible { stroke-width: 26; }
    .center { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; padding: 22%; gap: 0.1rem; }
    .c-label { font-size: 0.78rem; color: var(--muted); }
    .c-value { font-size: clamp(1.5rem, 4vw, 2rem); line-height: 1.1; }
    .c-sub { font-size: 0.74rem; color: var(--muted); }
  `,
})
export class Donut {
  readonly data = input.required<Slice[]>();
  readonly active = signal<number | null>(null);
  readonly r = R;
  private svg = viewChild<ElementRef<SVGElement>>('svg');
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly total = computed(() => this.data().reduce((a, d) => a + d.value, 0));
  readonly hovered = computed(() => (this.active() === null ? null : this.data()[this.active()!] ?? null));
  readonly segs = computed(() => {
    const total = this.total() || 1;
    let acc = 0;
    return this.data().map((d) => {
      const frac = d.value / total;
      const seg = { key: d.key, label: d.label, value: d.value, color: d.color, len: Math.max(0, frac * C - (this.data().length > 1 ? GAP : 0)), rot: -90 + acc * 360 };
      acc += frac;
      return seg;
    });
  });

  constructor() {
    afterRenderEffect(() => {
      this.segs();
      const circles = Array.from(this.svg()?.nativeElement.querySelectorAll<SVGCircleElement>('.seg') ?? []);
      circles.forEach((c) => {
        const len = Number(c.dataset['len']);
        if (this.reduced) { c.style.strokeDasharray = `${len} ${C}`; return; }
        c.style.strokeDasharray = `0 ${C}`;
      });
      if (this.reduced) return;
      circles.forEach((c, i) => {
        const to = `${Number(c.dataset['len'])} ${C}`;
        animate(c, { strokeDasharray: [`0 ${C}`, to] }, { duration: 1.1, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] })
          .finished.then(() => (c.style.strokeDasharray = to));
      });
    });
  }

  fmt = (n: number) => money(n);
  share = (v: number) => Math.round((v / (this.total() || 1)) * 100);
}
