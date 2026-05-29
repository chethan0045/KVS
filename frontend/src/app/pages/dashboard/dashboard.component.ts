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

    <!-- ============ BRICK PIPELINE ============ -->
    <h5 class="section-title"><i class="fas fa-stream me-2"></i>Brick Pipeline</h5>
    <div class="row g-3 mb-4">
      <div class="col-lg col-md-4 col-6" *ngFor="let p of pipeline">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">{{ p.label }}</div>
                <div class="card-value" [style.color]="p.color">{{ p.value | number }}</div>
                <small class="text-muted">{{ p.hint }}</small>
              </div>
              <div class="card-icon" [style.background-color]="p.color"><i class="fas" [ngClass]="p.icon"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ REVENUE & COLLECTIONS ============ -->
    <h5 class="section-title"><i class="fas fa-rupee-sign me-2"></i>Revenue &amp; Collections</h5>
    <div class="row g-3 mb-4">
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total Revenue</div>
                <div class="card-value text-brick-red">&#8377;{{ totalRevenue | number:'1.0-0' }}</div>
                <small class="text-muted">{{ totalSold | number }} bricks sold</small>
              </div>
              <div class="card-icon bg-brick-red"><i class="fas fa-rupee-sign"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Amount Collected</div>
                <div class="card-value" style="color: #27ae60;">&#8377;{{ customerTotalPaid | number:'1.0-0' }}</div>
                <small class="text-muted">{{ collectedPct }}% of billed</small>
              </div>
              <div class="card-icon" style="background-color: #27ae60;"><i class="fas fa-check-double"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Balance to Collect</div>
                <div class="card-value" style="color: #dc3545;">&#8377;{{ customerBalance | number:'1.0-0' }}</div>
                <small class="text-muted">from customers</small>
              </div>
              <div class="card-icon" style="background-color: #dc3545;"><i class="fas fa-hand-holding-usd"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total Billed</div>
                <div class="card-value" style="color: #2980b9;">&#8377;{{ customerTotalAmount | number:'1.0-0' }}</div>
                <small class="text-muted">to customers</small>
              </div>
              <div class="card-icon" style="background-color: #2980b9;"><i class="fas fa-file-invoice-dollar"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ EXPENSES & PAYABLES ============ -->
    <h5 class="section-title"><i class="fas fa-wallet me-2"></i>Expenses &amp; Payables</h5>
    <div class="row g-3 mb-4">
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Wages to Pay</div>
                <div class="card-value" style="color: #c0392b;">&#8377;{{ wagesBalance | number:'1.0-0' }}</div>
                <small class="text-muted">of &#8377;{{ totalWages | number:'1.0-0' }} earned</small>
              </div>
              <div class="card-icon" style="background-color: #c0392b;"><i class="fas fa-money-bill-wave"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Husk to Pay</div>
                <div class="card-value" style="color: #dc3545;">&#8377;{{ huskBalance | number:'1.0-0' }}</div>
                <small class="text-muted">of &#8377;{{ huskTotalCost | number:'1.0-0' }} cost</small>
              </div>
              <div class="card-icon" style="background-color: #dc3545;"><i class="fas fa-seedling"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total to Pay</div>
                <div class="card-value" style="color: #8e44ad;">&#8377;{{ (wagesBalance + huskBalance) | number:'1.0-0' }}</div>
                <small class="text-muted">wages + husk</small>
              </div>
              <div class="card-icon" style="background-color: #8e44ad;"><i class="fas fa-balance-scale"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card h-100" [style.border-left]="'4px solid ' + (netPosition >= 0 ? '#27ae60' : '#dc3545')">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Net Position</div>
                <div class="card-value" [style.color]="netPosition >= 0 ? '#27ae60' : '#dc3545'">
                  &#8377;{{ netPosition | number:'1.0-0' }}
                </div>
                <small class="text-muted">to collect &minus; to pay</small>
              </div>
              <div class="card-icon" [style.background-color]="netPosition >= 0 ? '#27ae60' : '#dc3545'">
                <i class="fas" [ngClass]="netPosition >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-title {
      color: #8B4513;
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid #e8e0d8;
    }
  `]
})
export class DashboardComponent implements OnInit {
  // Pipeline (brick quantities)
  totalProduced = 0;
  totalInKiln = 0;
  totalInFire = 0;
  totalReady = 0;
  totalSold = 0;

  // Revenue & collections
  totalRevenue = 0;
  customerTotalAmount = 0;
  customerTotalPaid = 0;
  customerBalance = 0;

  // Payables
  totalWages = 0;
  wagesBalance = 0;
  huskTotalCost = 0;
  huskTotalPaid = 0;
  huskBalance = 0;

  alertMessage = '';
  alertType = 'info';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get pipeline() {
    return [
      { label: 'Produced', value: this.totalProduced, color: '#c0392b', icon: 'fa-cubes', hint: 'raw bricks made' },
      { label: 'In Kiln', value: this.totalInKiln, color: '#e67e22', icon: 'fa-layer-group', hint: 'loaded, not fired' },
      { label: 'In Fire', value: this.totalInFire, color: '#8B4513', icon: 'fa-fire', hint: 'currently firing' },
      { label: 'Ready Stock', value: this.totalReady, color: '#27ae60', icon: 'fa-check-circle', hint: 'available to sell' },
      { label: 'Sold', value: this.totalSold, color: '#2980b9', icon: 'fa-shopping-cart', hint: 'all-time sold' }
    ];
  }

  get collectedPct(): number {
    if (!this.customerTotalAmount) return 0;
    return Math.round((this.customerTotalPaid / this.customerTotalAmount) * 100);
  }

  get netPosition(): number {
    return this.customerBalance - (this.wagesBalance + this.huskBalance);
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
        this.totalWages = s.total_wages_paid || 0;
        this.wagesBalance = s.wages_balance || 0;
        this.huskTotalCost = s.husk_total_cost || 0;
        this.huskTotalPaid = s.husk_total_paid || 0;
        this.huskBalance = s.husk_balance || 0;
        this.customerTotalAmount = s.customer_total_amount || 0;
        this.customerTotalPaid = s.customer_total_paid || 0;
        this.customerBalance = s.customer_balance || 0;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.alertMessage = 'Failed to load dashboard data';
        this.alertType = 'danger';
        setTimeout(() => this.alertMessage = '', 3000);
      }
    });
  }
}
