import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h2>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total Produced</div>
                <div class="card-value">{{ totalProduced | number }}</div>
              </div>
              <div class="card-icon bg-brick-red"><i class="fas fa-cubes"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total in Kiln</div>
                <div class="card-value">{{ totalInKiln | number }}</div>
              </div>
              <div class="card-icon" style="background-color: #e67e22;"><i class="fas fa-fire"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total in Fire</div>
                <div class="card-value">{{ totalInFire | number }}</div>
              </div>
              <div class="card-icon bg-brick-brown"><i class="fas fa-industry"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Ready Bricks</div>
                <div class="card-value" style="color: #27ae60;">{{ totalReady | number }}</div>
              </div>
              <div class="card-icon" style="background-color: #27ae60;"><i class="fas fa-check-circle"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total Sold</div>
                <div class="card-value">{{ totalSold | number }}</div>
              </div>
              <div class="card-icon" style="background-color: #27ae60;"><i class="fas fa-shopping-cart"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Revenue</div>
                <div class="card-value text-brick-red">&#8377;{{ totalRevenue | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon bg-brick-red"><i class="fas fa-rupee-sign"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Wages to Pay</div>
                <div class="card-value" style="color: #8e44ad;">&#8377;{{ totalWagesPaid | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #8e44ad;"><i class="fas fa-money-bill-wave"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Wages Balance</div>
                <div class="card-value" style="color: #c0392b;">&#8377;{{ wagesBalance | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #c0392b;"><i class="fas fa-balance-scale"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Husk Cost</div>
                <div class="card-value" style="color: #8B4513;">&#8377;{{ huskTotalCost | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon bg-brick-brown"><i class="fas fa-seedling"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Husk Paid</div>
                <div class="card-value" style="color: #27ae60;">&#8377;{{ huskTotalPaid | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #27ae60;"><i class="fas fa-check"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Husk Balance</div>
                <div class="card-value" style="color: #dc3545;">&#8377;{{ huskBalance | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #dc3545;"><i class="fas fa-exclamation-circle"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Customer Total Amount</div>
                <div class="card-value" style="color: #2980b9;">&#8377;{{ customerTotalAmount | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #2980b9;"><i class="fas fa-users"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Customer Paid</div>
                <div class="card-value" style="color: #27ae60;">&#8377;{{ customerTotalPaid | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #27ae60;"><i class="fas fa-check-double"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Customer Balance Due</div>
                <div class="card-value" style="color: #dc3545;">&#8377;{{ customerBalance | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #dc3545;"><i class="fas fa-hand-holding-usd"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activities -->
    <div class="row">
      <div class="col-12">
        <div class="card" style="border: none; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
          <div class="card-header bg-white border-0 pt-3">
            <h5 class="mb-0" style="color: #8B4513; font-weight: 700;">
              <i class="fas fa-clock me-2"></i>Recent Activities
            </h5>
          </div>
          <div class="card-body">
            <div *ngIf="recentActivities.length > 0">
              <div *ngFor="let activity of recentActivities" class="activity-item">
                <span class="activity-dot" [ngStyle]="{'background-color': getActivityColor(activity.type)}"></span>
                <div class="flex-grow-1">
                  <div class="fw-semibold" style="font-size: 0.9rem;">{{ activity.description }} - {{ activity.quantity | number }} bricks</div>
                  <small class="text-muted">{{ activity.created_at | date:'medium' }}</small>
                </div>
              </div>
            </div>
            <div *ngIf="recentActivities.length === 0" class="empty-state">
              <i class="fas fa-inbox d-block"></i>
              <p>No recent activities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  totalProduced = 0;
  totalInKiln = 0;
  totalInFire = 0;
  totalReady = 0;
  totalSold = 0;
  totalRevenue = 0;
  totalWagesPaid = 0;
  wagesBalance = 0;
  huskTotalCost = 0;
  huskTotalPaid = 0;
  huskBalance = 0;
  customerTotalAmount = 0;
  customerTotalPaid = 0;
  customerBalance = 0;
  recentActivities: any[] = [];
  alertMessage = '';
  alertType = 'info';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.apiService.getDashboard().subscribe({
      next: (data) => {
        const s = data.summary || data;
        this.totalProduced = s.total_produced || 0;
        this.totalInKiln = s.total_in_kiln || 0;
        this.totalInFire = s.total_in_fire || 0;
        this.totalReady = s.total_ready || 0;
        this.totalSold = s.total_sold || 0;
        this.totalRevenue = s.total_revenue || 0;
        this.totalWagesPaid = s.total_wages_paid || 0;
        this.wagesBalance = s.wages_balance || 0;
        this.huskTotalCost = s.husk_total_cost || 0;
        this.huskTotalPaid = s.husk_total_paid || 0;
        this.huskBalance = s.husk_balance || 0;
        this.customerTotalAmount = s.customer_total_amount || 0;
        this.customerTotalPaid = s.customer_total_paid || 0;
        this.customerBalance = s.customer_balance || 0;
        this.recentActivities = data.recent_activities || [];
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.alertMessage = 'Failed to load dashboard data';
        this.alertType = 'danger';
        setTimeout(() => this.alertMessage = '', 3000);
      }
    });
  }

  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      production: '#c0392b',
      kiln_loading: '#e67e22',
      manufacture: '#8B4513',
      sale: '#27ae60'
    };
    return colors[type] || '#999';
  }
}
