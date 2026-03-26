import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <img src="kvs-logo.png" alt="KVS Bricks" class="auth-logo">
        </div>

        <div *ngIf="alertMessage" class="alert" [ngClass]="'alert-' + alertType" role="alert">
          {{ alertMessage }}
        </div>

        <!-- Tab Buttons -->
        <div class="auth-tabs" *ngIf="step === 'form'">
          <button class="tab-btn" [class.active]="mode === 'login'" (click)="switchMode('login')">Login</button>
          <button class="tab-btn" [class.active]="mode === 'register'" (click)="switchMode('register')">Register</button>
        </div>

        <!-- Login Form -->
        <form *ngIf="mode === 'login' && step === 'form'" [formGroup]="loginForm" (ngSubmit)="loginMethod === 'otp' ? sendLoginOtp() : loginWithPassword()">
          <div class="mb-3">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" formControlName="email" placeholder="Enter your email">
          </div>
          <div *ngIf="loginMethod === 'password'" class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" formControlName="password" placeholder="Enter your password">
          </div>
          <button type="submit" class="btn btn-brick w-100" [disabled]="loginForm.invalid || loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
            {{ loginMethod === 'otp' ? 'Send OTP' : 'Login' }}
          </button>
          <div class="text-center mt-3">
            <a class="toggle-method" (click)="toggleLoginMethod()">
              {{ loginMethod === 'otp' ? 'Login with Password instead' : 'Login with OTP instead' }}
            </a>
          </div>
        </form>

        <!-- Register Form -->
        <form *ngIf="mode === 'register' && step === 'form'" [formGroup]="registerForm" (ngSubmit)="registerMethod === 'otp' ? sendRegisterOtp() : registerWithPassword()">
          <div class="mb-3">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" formControlName="name" placeholder="Enter your name">
          </div>
          <div class="mb-3">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" formControlName="email" placeholder="Enter your email">
          </div>
          <div *ngIf="registerMethod === 'password'" class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" formControlName="password" placeholder="Create a password (min 6 chars)">
          </div>
          <button type="submit" class="btn btn-brick w-100" [disabled]="registerForm.invalid || loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
            {{ registerMethod === 'otp' ? 'Send OTP' : 'Register' }}
          </button>
          <div class="text-center mt-3">
            <a class="toggle-method" (click)="toggleRegisterMethod()">
              {{ registerMethod === 'otp' ? 'Register with Password instead' : 'Register with OTP instead' }}
            </a>
          </div>
        </form>

        <!-- OTP Verification -->
        <div *ngIf="step === 'otp'">
          <p class="text-center text-muted mb-3">
            OTP sent to <strong>{{ otpEmail }}</strong>
          </p>
          <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()">
            <div class="mb-3">
              <label class="form-label">Enter OTP</label>
              <input type="text" class="form-control otp-input" formControlName="otp" placeholder="------" maxlength="6" autofocus>
            </div>
            <button type="submit" class="btn btn-brick w-100 mb-2" [disabled]="otpForm.invalid || loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
              Verify OTP
            </button>
            <button type="button" class="btn btn-outline-secondary w-100" (click)="backToForm()">
              <i class="fas fa-arrow-left me-1"></i> Back
            </button>
          </form>
          <p class="text-center mt-3 text-muted" style="font-size: 0.85rem;">
            Check your email inbox (and spam folder) for the OTP
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #2c1810 0%, #8B4513 50%, #c0392b 100%);
      padding: 20px;
    }
    .auth-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .auth-logo {
      width: 180px;
      height: auto;
    }
    .auth-tabs {
      display: flex;
      margin-bottom: 25px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #c0392b;
    }
    .tab-btn {
      flex: 1;
      padding: 10px;
      border: none;
      background: #fff;
      color: #c0392b;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: #c0392b;
      color: #fff;
    }
    .otp-input {
      text-align: center;
      font-size: 1.5rem;
      letter-spacing: 10px;
      font-weight: 700;
    }
    .btn-brick {
      background-color: #c0392b;
      border-color: #c0392b;
      color: #fff;
      padding: 10px;
      font-weight: 600;
    }
    .btn-brick:hover {
      background-color: #a93226;
      border-color: #a93226;
      color: #fff;
    }
    .btn-brick:disabled {
      background-color: #d9a9a4;
      border-color: #d9a9a4;
    }
    .toggle-method {
      color: #c0392b;
      cursor: pointer;
      font-size: 0.9rem;
      text-decoration: underline;
    }
    .toggle-method:hover {
      color: #a93226;
    }
    .form-label {
      font-weight: 600;
      color: #555;
      font-size: 0.9rem;
    }
    .form-control:focus {
      border-color: #c0392b;
      box-shadow: 0 0 0 0.2rem rgba(192, 57, 43, 0.15);
    }
  `]
})
export class LoginComponent {
  mode: 'login' | 'register' = 'login';
  step: 'form' | 'otp' = 'form';
  loginMethod: 'otp' | 'password' = 'password';
  registerMethod: 'otp' | 'password' = 'password';
  otpEmail = '';
  loading = false;
  alertMessage = '';
  alertType = 'danger';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('')
  });

  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('')
  });

  otpForm = new FormGroup({
    otp: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{6}$')])
  });

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/']);
    }
    this.updateLoginValidators();
    this.updateRegisterValidators();
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.alertMessage = '';
  }

  toggleLoginMethod(): void {
    this.loginMethod = this.loginMethod === 'otp' ? 'password' : 'otp';
    this.alertMessage = '';
    this.updateLoginValidators();
  }

  toggleRegisterMethod(): void {
    this.registerMethod = this.registerMethod === 'otp' ? 'password' : 'otp';
    this.alertMessage = '';
    this.updateRegisterValidators();
  }

  private updateLoginValidators(): void {
    const pw = this.loginForm.get('password')!;
    if (this.loginMethod === 'password') {
      pw.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      pw.clearValidators();
      pw.setValue('');
    }
    pw.updateValueAndValidity();
  }

  private updateRegisterValidators(): void {
    const pw = this.registerForm.get('password')!;
    if (this.registerMethod === 'password') {
      pw.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      pw.clearValidators();
      pw.setValue('');
    }
    pw.updateValueAndValidity();
  }

  loginWithPassword(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.alertMessage = '';
    const { email, password } = this.loginForm.value;

    this.authService.loginWithPassword(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.alertMessage = err.error?.error || 'Login failed';
        this.alertType = 'danger';
        this.loading = false;
      }
    });
  }

  registerWithPassword(): void {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.alertMessage = '';
    const { name, email, password } = this.registerForm.value;

    this.authService.registerWithPassword(name!, email!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.alertMessage = err.error?.error || 'Registration failed';
        this.alertType = 'danger';
        this.loading = false;
      }
    });
  }

  sendLoginOtp(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.alertMessage = '';
    const email = this.loginForm.value.email!;

    this.authService.login(email).subscribe({
      next: () => {
        this.otpEmail = email;
        this.step = 'otp';
        this.loading = false;
      },
      error: (err) => {
        this.alertMessage = err.error?.error || 'Failed to send OTP';
        this.alertType = 'danger';
        this.loading = false;
      }
    });
  }

  sendRegisterOtp(): void {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.alertMessage = '';
    const { name, email } = this.registerForm.value;

    this.authService.register(name!, email!).subscribe({
      next: () => {
        this.otpEmail = email!;
        this.step = 'otp';
        this.loading = false;
      },
      error: (err) => {
        this.alertMessage = err.error?.error || 'Failed to send OTP';
        this.alertType = 'danger';
        this.loading = false;
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;
    this.loading = true;
    this.alertMessage = '';
    const otp = this.otpForm.value.otp!;

    const verify$ = this.mode === 'register'
      ? this.authService.verifyOtp(this.otpEmail, otp)
      : this.authService.loginVerify(this.otpEmail, otp);

    verify$.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.alertMessage = err.error?.error || 'OTP verification failed';
        this.alertType = 'danger';
        this.loading = false;
      }
    });
  }

  backToForm(): void {
    this.step = 'form';
    this.otpForm.reset();
    this.alertMessage = '';
  }
}
