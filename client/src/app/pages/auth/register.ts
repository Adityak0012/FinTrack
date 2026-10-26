import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { errorMessage } from '../../core/models';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'ft-register',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  template: `
    <ft-auth-shell>
      <div class="m-logo"><span class="mark"><i class="bi bi-graph-up-arrow"></i></span>FinTrack</div>
      <h1>Create your account</h1>
      <p class="lede">Start tracking in under a minute.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) { <div class="alert" role="alert">{{ error() }}</div> }
        <div class="field">
          <label for="name">Name</label>
          <input id="name" formControlName="name" autocomplete="name" placeholder="Your name" [class.invalid]="show('name')" />
          @if (show('name')) { <span class="err">Enter your name.</span> }
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" [class.invalid]="show('email')" />
          @if (show('email')) { <span class="err">Enter a valid email address.</span> }
        </div>
        <div class="field">
          <label for="password">Password</label>
          <div class="pw">
            <input id="password" [type]="reveal() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" placeholder="At least 6 characters" [class.invalid]="show('password')" />
            <button type="button" (click)="reveal.set(!reveal())" [attr.aria-label]="reveal() ? 'Hide password' : 'Show password'"><i class="bi" [class]="reveal() ? 'bi-eye-slash' : 'bi-eye'"></i></button>
          </div>
          @if (show('password')) { <span class="err">Use at least 6 characters.</span> }
        </div>
        <button class="btn brand lg submit" type="submit" [disabled]="busy()">{{ busy() ? 'Creating account…' : 'Create account' }}</button>
      </form>
      <p class="switch">Already have an account? <a routerLink="/login">Log in</a></p>
    </ft-auth-shell>
  `,
  styleUrl: './auth.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly reveal = signal(false);
  readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.minLength(2)]], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]] });

  show(n: 'name' | 'email' | 'password'): boolean { const c = this.form.controls[n]; return c.invalid && (c.touched || c.dirty); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true); this.error.set('');
    const { name, email, password } = this.form.getRawValue();
    this.auth.register(name, email, password).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (e) => { this.error.set(errorMessage(e)); this.busy.set(false); },
    });
  }
}
