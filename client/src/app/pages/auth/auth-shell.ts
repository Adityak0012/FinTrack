import { Component, input } from '@angular/core';
import { animate, stagger } from 'motion';
import { afterNextRender, ElementRef, inject } from '@angular/core';
import { Spark } from '../../shared/spark';

/** Split-screen frame shared by login and register: animated brand panel on the left, form on the right. */
@Component({
  selector: 'ft-auth-shell',
  imports: [Spark],
  template: `
    <div class="wrap">
      <aside class="brand-panel">
        <div class="glow g1"></div><div class="glow g2"></div>
        <div class="logo"><span class="mark"><i class="bi bi-graph-up-arrow"></i></span>FinTrack</div>
        <div class="pitch">
          <h2 class="serif">Know where<br />every rupee goes.</h2>
          <p>Log spending in seconds, set monthly budgets, and see the month at a glance.</p>
        </div>
        <div class="float-card" data-f>
          <div class="fc-top"><span>Net this month</span><span class="pill up"><i class="bi bi-arrow-up-right"></i> 12%</span></div>
          <strong class="num serif">₹48,260</strong>
          <ft-spark class="sp" [values]="[12, 18, 15, 24, 22, 31, 29, 38, 44]" color="#cdbdff" />
        </div>
        <div class="float-chip c1" data-f><i class="bi bi-cup-hot"></i> Food <b>₹420</b></div>
        <div class="float-chip c2" data-f><i class="bi bi-bullseye"></i> Budget 82% used</div>
      </aside>
      <main class="form-side">
        <div class="form-box"><ng-content /></div>
      </main>
    </div>
  `,
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly _ = input('');
  constructor() {
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const f = Array.from(this.el.querySelectorAll<HTMLElement>('[data-f]'));
      animate(f, { opacity: [0, 1], transform: ['translateY(30px) scale(.96)', 'translateY(0) scale(1)'] }, { delay: stagger(0.15, { startDelay: 0.5 }), duration: 0.9, ease: [0.16, 1, 0.3, 1] });
      animate('.pitch h2, .pitch p', { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }, { delay: stagger(0.12, { startDelay: 0.15 }), duration: 0.9, ease: [0.16, 1, 0.3, 1] });
      animate('.form-box > *', { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { delay: stagger(0.06, { startDelay: 0.2 }), duration: 0.7, ease: [0.2, 0.8, 0.2, 1] });
    });
  }
}
