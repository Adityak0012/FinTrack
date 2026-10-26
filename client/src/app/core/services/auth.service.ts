import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models';

const TOKEN_KEY = 'fintrack.token';
const USER_KEY = 'fintrack.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly _user = signal<User | null>(readJson<User>(USER_KEY));
  private readonly _token = signal<string | null>(get(TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token() && !!this._user());

  token(): string | null { return this._token(); }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(tap((r) => this.setSession(r)));
  }
  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { name, email, password }).pipe(tap((r) => this.setSession(r)));
  }

  logout(redirect = true): void {
    this._token.set(null);
    this._user.set(null);
    remove(TOKEN_KEY);
    remove(USER_KEY);
    if (redirect) this.router.navigateByUrl('/login');
  }

  private setSession({ token, user }: AuthResponse): void {
    this._token.set(token);
    this._user.set(user);
    set(TOKEN_KEY, token);
    set(USER_KEY, JSON.stringify(user));
  }
}

function get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function set(k: string, v: string): void { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }
function remove(k: string): void { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } }
function readJson<T>(k: string): T | null { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } }
