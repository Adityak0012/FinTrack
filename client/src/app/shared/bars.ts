import { Component, ElementRef, afterRenderEffect, computed, input, signal, viewChild } from '@angular/core';
import { animate, stagger } from 'motion';
import { compact, money, monthShort } from '../core/format';
import { MonthPoint } from '../core/models';

const W = 640, H = 270, PL = 46, PR = 8, PT = 14, PB = 30;

/** Income vs spending per month: grouped bars that grow in, with a tooltip on hover. */
@Component({
  selector: 'ft-bars',
  template: `
    <div class="chart" (mouseleave)="active.set(null)">
      <svg #svg [attr.viewBox]="'0 0 ' + w + ' ' + h" role="img" aria-label="Income and spending by month">
        <defs>
          <linearGradient id="ftgi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a40" /><stop offset="1" stop-color="#111113" /></linearGradient>
          <linearGradient id="ftge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dccfff" /><stop offset="1" stop-color="#b4a0ff" /></linearGradient>
        </defs>
        @for (t of ticks(); track t.v) {
          <line [attr.x1]="pl" [attr.x2]="w - pr" [attr.y1]="t.y" [attr.y2]="t.y" stroke="#e4e4e0" [attr.stroke-dasharray]="t.v === 0 ? null : '3 4'" />
          <text [attr.x]="pl - 8" [attr.y]="t.y + 4" text-anchor="end" class="ax">{{ t.label }}</text>
        }
        @for (g of groups(); track g.month; let i = $index) {
          <g [class.dim]="active() !== null && active() !== i">
            <rect class="bar inc" [attr.x]="g.x" [attr.y]="g.iy" [attr.width]="g.bw" [attr.height]="g.ih" rx="3" />
            <rect class="bar exp" [attr.x]="g.x + g.bw + 4" [attr.y]="g.ey" [attr.width]="g.bw" [attr.height]="g.eh" rx="3" />
            <text [attr.x]="g.cx" [attr.y]="h - 8" text-anchor="middle" class="ax" [class.cur]="active() === i">{{ g.label }}</text>
            <rect class="hit" [attr.x]="g.cx - g.slot / 2" [attr.y]="pt" [attr.width]="g.slot" [attr.height]="h - pt - pb" fill="transparent" (mouseenter)="active.set(i)" (focus)="active.set(i)" tabindex="0" [attr.aria-label]="g.label + ': income ' + fmt(g.income) + ', spent ' + fmt(g.expense)" />
          </g>
        }
      </svg>
      @if (tip(); as t) {
        <div class="tip" [style.left.%]="t.left" [class.right]="t.left > 62">
          <strong>{{ t.title }}</strong>
          <span><i class="dot inc"></i>Income <b class="num">{{ fmt(t.income) }}</b></span>
          <span><i class="dot exp"></i>Spent <b class="num">{{ fmt(t.expense) }}</b></span>
          <span class="net" [class.neg]="t.income - t.expense < 0">Saved <b class="num">{{ fmt(t.income - t.expense) }}</b></span>
        </div>
      }
    </div>
    <div class="legend"><span><i class="dot inc"></i>Income</span><span><i class="dot exp"></i>Spent</span></div>
  `,
  styles: `
    :host { display: block; }
    .chart { position: relative; }
    svg { width: 100%; height: auto; overflow: visible; }
    .ax { font-size: 11.5px; fill: var(--muted); font-family: var(--font); }
    .ax.cur { fill: var(--ink); font-weight: 600; }
    .bar { transform-box: fill-box; transform-origin: bottom; transition: opacity 0.25s; }
    .bar.inc { fill: url(#ftgi); } .bar.exp { fill: url(#ftge); }
    .dim .bar { opacity: 0.3; }
    .hit { cursor: default; outline: none; }
    .tip { position: absolute; top: 0; transform: translateX(-12%); background: var(--panel); color: #fff; border-radius: 0.5rem; padding: 0.65rem 0.8rem; font-size: 0.8rem; display: grid; gap: 0.2rem; min-width: 10.5rem; pointer-events: none; box-shadow: 0 14px 30px -12px rgba(11, 13, 23, 0.5); animation: pop 0.18s var(--ease); z-index: 2; }
    .tip.right { transform: translateX(-88%); }
    .tip strong { font-weight: 600; margin-bottom: 0.1rem; }
    .tip span { display: flex; align-items: center; gap: 0.4rem; justify-content: space-between; color: #c5c9db; }
    .tip span b { color: #fff; font-weight: 600; margin-left: auto; }
    .tip .net { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.3rem; margin-top: 0.1rem; }
    .tip .net b { color: #8fe0bd; } .tip .net.neg b { color: #ff8b7e; }
    .dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; display: inline-block; background: var(--panel); } .dot.exp { background: var(--accent-2); }
    .legend { display: flex; gap: 1.1rem; justify-content: center; font-size: 0.8rem; color: var(--muted); margin-top: 0.4rem; span { display: inline-flex; align-items: center; gap: 0.4rem; } }
    @keyframes pop { from { opacity: 0; transform: translateY(4px) translateX(-12%); } }
  `,
})
export class Bars {
  readonly data = input.required<MonthPoint[]>();
  readonly active = signal<number | null>(null);
  readonly w = W; readonly h = H; readonly pl = PL; readonly pr = PR; readonly pt = PT; readonly pb = PB;
  private svg = viewChild<ElementRef<SVGElement>>('svg');
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private max = computed(() => {
    const m = Math.max(1, ...this.data().flatMap((d) => [d.income, d.expense]));
    const step = Math.pow(10, Math.floor(Math.log10(m)));
    const nice = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((k) => k * step).find((v) => v >= m) ?? m;
    return nice;
  });
  readonly ticks = computed(() => [0, 1, 2, 3, 4].map((i) => {
    const v = (this.max() / 4) * i;
    return { v, y: H - PB - (v / this.max()) * (H - PT - PB), label: compact(v) };
  }));
  readonly groups = computed(() => {
    const d = this.data();
    const slot = (W - PL - PR) / Math.max(1, d.length);
    const bw = Math.min(26, slot * 0.3);
    const base = H - PB;
    const scale = (H - PT - PB) / this.max();
    return d.map((p, i) => {
      const cx = PL + slot * i + slot / 2;
      const ih = Math.max(p.income > 0 ? 2 : 0, p.income * scale);
      const eh = Math.max(p.expense > 0 ? 2 : 0, p.expense * scale);
      return { month: p.month, label: monthShort(p.month), income: p.income, expense: p.expense, x: cx - bw - 2, bw, cx, slot, ih, eh, iy: base - ih, ey: base - eh };
    });
  });
  readonly tip = computed(() => {
    const i = this.active();
    const g = i === null ? null : this.groups()[i];
    return g ? { title: `${g.label} ${g.month.slice(0, 4)}`, income: g.income, expense: g.expense, left: (g.cx / W) * 100 } : null;
  });

  constructor() {
    afterRenderEffect(() => {
      this.groups();
      if (this.reduced) return;
      const bars = Array.from(this.svg()?.nativeElement.querySelectorAll<SVGRectElement>('.bar') ?? []);
      animate(bars, { transform: ['scaleY(0)', 'scaleY(1)'] }, { duration: 0.8, delay: stagger(0.035), ease: [0.16, 1, 0.3, 1] });
    });
  }
  fmt = (n: number) => money(n);
}
