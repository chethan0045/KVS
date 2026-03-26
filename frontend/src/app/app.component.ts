import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <ng-container *ngIf="authService.isLoggedIn; else loginView">
      <!-- Mobile top bar -->
      <div class="mobile-topbar">
        <button class="hamburger-btn" (click)="toggleSidebar()">
          <i class="fas fa-bars"></i>
        </button>
        <img src="kvs-logo.png" alt="KVS Bricks" class="mobile-logo">
      </div>
      <!-- Overlay -->
      <div class="sidebar-overlay" [class.show]="sidebarOpen" (click)="closeSidebar()"></div>
      <div class="sidebar" [class.open]="sidebarOpen">
        <div class="sidebar-brand">
          <img src="kvs-logo.png" alt="KVS Bricks" class="sidebar-logo">
        </div>
        <ul class="sidebar-nav">
          <li>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeSidebar()">
              <i class="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a routerLink="/production" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-industry"></i>
              <span>Brick Production</span>
            </a>
          </li>
          <li>
            <a routerLink="/kiln-loading" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-truck-loading"></i>
              <span>Kiln Loading</span>
            </a>
          </li>
          <li>
            <a routerLink="/kiln-manufacture" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-fire"></i>
              <span>Kiln Manufacturing</span>
            </a>
          </li>
          <li>
            <a routerLink="/brick-sales" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-shopping-cart"></i>
              <span>Brick Sales</span>
            </a>
          </li>
          <li>
            <a routerLink="/customers" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-user-tie"></i>
              <span>Customers</span>
            </a>
          </li>
          <li>
            <a routerLink="/husk-loads" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-seedling"></i>
              <span>Husk Loads</span>
            </a>
          </li>
          <li>
            <a routerLink="/employees" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-users"></i>
              <span>Employees</span>
            </a>
          </li>
          <li>
            <a routerLink="/wages-report" routerLinkActive="active" (click)="closeSidebar()">
              <i class="fas fa-file-invoice-dollar"></i>
              <span>Wages Report</span>
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">
          <div class="user-info">
            <i class="fas fa-user-circle"></i>
            <span>{{ userName }}</span>
          </div>
          <button class="logout-btn" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </ng-container>
    <ng-template #loginView>
      <router-outlet></router-outlet>
    </ng-template>
  `
})
export class AppComponent {
  userName = '';
  sidebarOpen = false;

  constructor(public authService: AuthService, private router: Router) {
    this.updateUserName();
    this.authService.isLoggedIn$.subscribe(() => this.updateUserName());
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  updateUserName(): void {
    const user = this.authService.getUser();
    this.userName = user?.name || '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
