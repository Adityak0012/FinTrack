import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';
import { animate, inView, stagger } from 'motion';

/**
 * Entrance animations built with the `motion` library (the engine behind Framer Motion).
 *   ftReveal            fade and rise once the element scrolls into view
 *   ftReveal="stagger"  the direct children rise one after another
 *   ftReveal="intro"    plays on load: [data-in] children rise in sequence, [data-in="word"] slide up from a mask
 * Does nothing when the system asks for reduced motion.
 */
@Directive({ selector: '[ftReveal]' })
export class Reveal implements OnDestroy {
  readonly ftReveal = input<'' | 'stagger' | 'intro'>('');
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private stop?: () => void;
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    if (this.reduced) return;
    afterNextRender(() => {
      const mode = this.ftReveal();
      if (mode === 'intro') return this.intro();
      const kids = mode === 'stagger' ? (Array.from(this.el.children) as HTMLElement[]) : [this.el];
      kids.forEach((k) => (k.style.opacity = '0'));
      this.stop = inView(this.el, () => {
        animate(kids, { opacity: [0, 1], transform: ['translateY(22px)', 'translateY(0px)'] }, { duration: 0.6, delay: stagger(0.07), ease: [0.2, 0.8, 0.2, 1] })
          .finished.then(() => kids.forEach((k) => { k.style.opacity = ''; k.style.transform = ''; }));
        this.stop?.();
      }, { amount: 0.1 });
    });
  }

  private intro(): void {
    const words = Array.from(this.el.querySelectorAll<HTMLElement>('[data-in="word"]'));
    const rest = Array.from(this.el.querySelectorAll<HTMLElement>('[data-in]:not([data-in="word"])'));
    words.forEach((w) => (w.style.transform = 'translateY(115%)'));
    rest.forEach((r) => (r.style.opacity = '0'));
    animate(words, { transform: ['translateY(115%)', 'translateY(0%)'] }, { duration: 0.9, delay: stagger(0.08), ease: [0.16, 1, 0.3, 1] });
    animate(rest, { opacity: [0, 1], transform: ['translateY(26px)', 'translateY(0px)'] }, { type: 'spring', stiffness: 170, damping: 24, delay: stagger(0.08, { startDelay: 0.35 }) })
      .finished.then(() => rest.forEach((r) => { r.style.opacity = ''; r.style.transform = ''; }));
  }

  ngOnDestroy(): void { this.stop?.(); }
}
