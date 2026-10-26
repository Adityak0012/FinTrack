import { Component, ElementRef, afterRenderEffect, computed, input, viewChild } from '@angular/core';
import { animate } from 'motion';

/** A smooth line with a soft fill underneath. The line draws itself in. */
@Component({
  selector: 'ft-spark',
  template: `
    <svg #svg viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.32" />
          <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path class="area" [attr.d]="area()" [attr.fill]="'url(#' + gid + ')'" />
      <path class="line" [attr.d]="line()" fill="none" [attr.stroke]="color()" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" vector-effect="non-scaling-stroke" />
    </svg>
  `,
  styles: `:host { display: block; } svg { width: 100%; height: 100%; display: block; overflow: visible; }`,
})
export class Spark {
  readonly values = input.required<number[]>();
  readonly color = input('#ffffff');
  readonly gid = 'sp' + Math.random().toString(36).slice(2, 8);
  private svg = viewChild<ElementRef<SVGElement>>('svg');
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private pts = computed(() => {
    const v = this.values();
    const max = Math.max(1, ...v);
    return v.map((y, i) => [(i / Math.max(1, v.length - 1)) * 300, 74 - (y / max) * 66] as [number, number]);
  });
  readonly line = computed(() => {
    const p = this.pts();
    if (p.length < 2) return '';
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 1; i < p.length; i++) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i];
      const mx = (x0 + x1) / 2;
      d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    return d;
  });
  readonly area = computed(() => (this.line() ? `${this.line()} L300,80 L0,80 Z` : ''));

  constructor() {
    afterRenderEffect(() => {
      this.line();
      if (this.reduced) return;
      const el = this.svg()?.nativeElement;
      const line = el?.querySelector('.line');
      const area = el?.querySelector('.area');
      if (line) animate(line, { strokeDashoffset: [1, 0], strokeDasharray: ['1 1', '1 1'] }, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
      if (area) animate(area, { opacity: [0, 1] }, { duration: 1.2, delay: 0.3 });
    });
  }
}
