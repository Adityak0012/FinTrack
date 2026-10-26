import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { errorMessage } from '../../core/models';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'ft-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  template: `
    <ft-auth-shell>
      <div class="m-logo"><span class="mark"><i class="bi bi-graph-up-arrow"></i></span>FinTrack</div>
      <h1>Welcome back</h1>
      <p class="lede">Log in to see how your month is going.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) { <div class="alert" role="alert">{{ error() }}</div> }
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" [class.invalid]="show('email')" />
          @if (show('email')) { <span class="err">Enter a valid email address.</span> }
        </div>
        <div class="field">
          <label for="password">Password</label>
          <div class="pw">
            <input id="password" [type]="reveal() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="Your password" [class.invalid]="show('password')" />
            <button type="button" (click)="reveal.set(!reveal())" [attr.aria-label]="reveal() ? 'Hide password' : 'Show password'"><i class="bi" [class]="reveal() ? 'bi-eye-slash' : 'bi-eye'"></i></button>
          </div>
          @if (show('password')) { <span class="err">Enter your password.</span> }
        </div>
        <button class="btn brand lg submit" type="submit" [disabled]="busy()">{{ busy() ? 'Logging in…' : 'Log in' }}</button>
      </form>
      <button type="button" class="demo" (click)="demo()"><i class="bi bi-lightning-charge"></i> Try the demo account</button>
      <p class="switch">New here? <a routerLink="/register">Create an account</a></p>
    </ft-auth-shell>
  `,
  styleUrl: './auth.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly reveal = signal(false);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });

  show(n: 'email' | 'password'): boolean { const c = this.form.controls[n]; return c.invalid && (c.touched || c.dirty); }

  demo(): void { this.form.setValue({ email: 'demo@fintrack.dev', password: 'Demo@123' }); this.submit(); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true); this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (e) => { this.error.set(errorMessage(e)); this.busy.set(false); },
    });
  }
}
