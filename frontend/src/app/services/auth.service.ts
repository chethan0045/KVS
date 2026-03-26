import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = '/api/auth';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  get isLoggedIn(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  register(name: string, email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, { name, email });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-otp`, { email, otp }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.loggedIn.next(true);
      })
    );
  }

  login(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email });
  }

  registerWithPassword(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/register/password`, { name, email, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.loggedIn.next(true);
      })
    );
  }

  loginWithPassword(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/password`, { email, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.loggedIn.next(true);
      })
    );
  }

  loginVerify(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/verify`, { email, otp }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.loggedIn.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.loggedIn.next(false);
  }
}
