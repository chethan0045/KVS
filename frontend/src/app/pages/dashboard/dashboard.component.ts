import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Tile {
  label: string;
  value: number;
  prefix?: string;
  format?: string;
  hint: string;
  sub?: string;
  icon: string;
  color: string;
  link: string;
  meter?: number;          // 0-100, renders a progress meter under the value
  tone?: 'good' | 'bad';   // polarity colouring for the value (status colour + icon)
}

interface PipelineStage {
  label: string;
  value: number;
  color: string;
  icon: string;
  hint: string;
  link: string;
}

interface KilnStatus {
  kiln_number: string;
  status: 'loading' | 'firing' | 'ready' | 'empty' | string;
  quantity_loaded: number;
  quantity_sold: number;
  remaining: number;
  loadings: number;
  first_loading_date: string | null;
  last_loading_date: string | null;
}

interface Activity {
  type: 'production' | 'kiln_loading' | 'manufacture' | 'sale' | string;
  label: string;
  detail: string;
  quantity: number | null;
  amount: number | null;
  date: string;
  created_at: string;
}

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
      <div class="d-flex align-items-center gap-3">
        <span class="header-date d-none d-sm-inline">
          <i class="far fa-calendar me-1"></i>{{ today | date:'EEEE, d MMM y' }}
        </span>
        <button class="btn btn-outline-secondary btn-sm" (click)="loadDashboard()" [disabled]="loading">
          <i class="fas fa-rotate-right me-1" [class.fa-spin]="loading"></i>Refresh
        </button>
      </div>
    </div>

    <!-- ============ THIS MONTH ============ -->
    <div class="month-strip mb-4">
      <div class="month-title">
        <i class="far fa-calendar-check me-2"></i>This month
        <span class="month-name">{{ monthStart | date:'MMMM y' }}</span>
      </div>
      <div class="month-items">
        <a class="month-item" *ngFor="let m of monthItems" [routerLink]="m.link">
          <div class="month-value">
            {{ m.prefix || '' }}{{ m.value | number:(m.format || '1.0-0') }}<span class="month-unit" *ngIf="m.unit"> {{ m.unit }}</span>
          </div>
          <div class="month-label">{{ m.label }}</div>
        </a>
      </div>
    </div>

    <!-- ============ BRICK PIPELINE ============ -->
    <h5 class="section-title"><i class="fas fa-stream me-2"></i>Brick Pipeline</h5>
    <div class="pipeline mb-4">
      <ng-container *ngFor="let p of pipeline; let last = last">
        <a class="card stats-card pipe-card" [routerLink]="p.link">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="card-label">{{ p.label }}</div>
              <div class="pipe-icon" [style.background-color]="p.color"><i class="fas" [ngClass]="p.icon"></i></div>
            </div>
            <div class="tile-value">{{ p.value | number }}</div>
            <div class="tile-hint">{{ p.hint }}</div>
          </div>
        </a>
        <div class="pipe-arrow" *ngIf="!last"><i class="fas fa-chevron-right"></i></div>
      </ng-container>
    </div>

    <!-- ============ KILN STATUS ============ -->
    <h5 class="section-title">
      <i class="fas fa-fire me-2"></i>Kiln Status
      <a routerLink="/kiln-loading" class="section-link">Manage kilns <i class="fas fa-arrow-right ms-1"></i></a>
    </h5>
    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6" *ngFor="let k of kilns">
        <div class="card stats-card kiln-card h-100" [ngClass]="'kiln-' + k.status">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="kiln-name"><i class="fas fa-fire-burner me-2"></i>Kiln {{ k.kiln_number }}</div>
              <span class="badge badge-status" [ngClass]="kilnBadge(k.status)">
                <i class="fas me-1" [ngClass]="kilnIcon(k.status)"></i>{{ kilnLabel(k.status) }}
              </span>
            </div>
            <ng-container *ngIf="k.status !== 'empty'; else emptyKiln">
              <div class="kiln-stat"><span>Loaded</span><strong>{{ k.quantity_loaded | number }}</strong></div>
              <div class="kiln-stat"><span>Sold</span><strong>{{ k.quantity_sold | number }}</strong></div>
              <div class="kiln-stat"><span>Remaining</span><strong>{{ k.remaining | number }}</strong></div>
              <div class="meter mt-2" role="progressbar" [attr.aria-valuenow]="soldPct(k)" aria-valuemin="0" aria-valuemax="100">
                <div class="meter-fill" [style.width.%]="soldPct(k)"></div>
              </div>
              <div class="kiln-foot">
                <span>{{ soldPct(k) }}% sold</span>
                <span>{{ k.loadings }} loading{{ k.loadings === 1 ? '' : 's' }} · last {{ k.last_loading_date | date:'d MMM' }}</span>
              </div>
            </ng-container>
            <ng-template #emptyKiln>
              <div class="kiln-empty-text">
                No active loading.
                <a routerLink="/kiln-loading">Load bricks <i class="fas fa-arrow-right ms-1"></i></a>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ REVENUE & COLLECTIONS ============ -->
    <h5 class="section-title">
      <i class="fas fa-rupee-sign me-2"></i>Revenue &amp; Collections
      <a routerLink="/brick-sales" class="section-link">Sales <i class="fas fa-arrow-right ms-1"></i></a>
    </h5>
    <div class="row g-3 mb-4">
      <div class="col-lg-7">
        <div class="row g-3">
          <div class="col-sm-6" *ngFor="let t of revenueTiles">
            <ng-container *ngTemplateOutlet="tile; context: { $implicit: t }"></ng-container>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card stats-card list-card h-100">
          <div class="list-head">
            <span><i class="fas fa-hand-holding-usd me-2"></i>Customers with dues</span>
            <a routerLink="/customers">View all</a>
          </div>
          <table class="table list-table mb-0" *ngIf="topCustomers.length > 0; else noDues">
            <tbody>
              <tr *ngFor="let c of topCustomers">
                <td>
                  <div class="list-name">{{ c.name }}</div>
                  <div class="list-sub">paid &#8377;{{ c.total_paid | number:'1.0-0' }} of &#8377;{{ c.total_amount | number:'1.0-0' }}</div>
                </td>
                <td class="text-end"><span class="list-amount">&#8377;{{ c.balance | number:'1.0-0' }}</span></td>
              </tr>
            </tbody>
          </table>
          <ng-template #noDues>
            <div class="list-empty"><i class="fas fa-check-circle me-2"></i>No outstanding customer balances</div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- ============ EXPENSES & PAYABLES ============ -->
    <h5 class="section-title">
      <i class="fas fa-wallet me-2"></i>Expenses &amp; Payables
      <a routerLink="/wages-report" class="section-link">Wages report <i class="fas fa-arrow-right ms-1"></i></a>
    </h5>
    <div class="row g-3 mb-4">
      <div class="col-lg-7">
        <div class="row g-3">
          <div class="col-sm-6" *ngFor="let t of expenseTiles">
            <ng-container *ngTemplateOutlet="tile; context: { $implicit: t }"></ng-container>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card stats-card list-card h-100">
          <div class="list-head">
            <span><i class="fas fa-users me-2"></i>Employees to pay</span>
            <a routerLink="/employees">View all</a>
          </div>
          <table class="table list-table mb-0" *ngIf="topEmployees.length > 0; else noPayables">
            <tbody>
              <tr *ngFor="let e of topEmployees">
                <td>
                  <div class="list-name">{{ e.name }}</div>
                  <div class="list-sub">earned &#8377;{{ e.total_wages_earned | number:'1.0-0' }} · paid &#8377;{{ e.total_paid | number:'1.0-0' }}</div>
                </td>
                <td class="text-end"><span class="list-amount">&#8377;{{ e.balance | number:'1.0-0' }}</span></td>
              </tr>
            </tbody>
          </table>
          <ng-template #noPayables>
            <div class="list-empty"><i class="fas fa-check-circle me-2"></i>No wages pending</div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- ============ RECENT ACTIVITY ============ -->
    <h5 class="section-title"><i class="fas fa-clock-rotate-left me-2"></i>Recent Activity</h5>
    <div class="card stats-card list-card mb-4">
      <ul class="activity-list" *ngIf="activities.length > 0; else noActivity">
        <li *ngFor="let a of activities">
          <a class="activity-row" [routerLink]="activityLink(a.type)">
            <span class="act-icon" [ngClass]="'act-' + a.type"><i class="fas" [ngClass]="activityIcon(a.type)"></i></span>
            <span class="act-body">
              <span class="act-title">{{ a.label }}<span class="act-detail" *ngIf="a.detail"> · {{ a.detail }}</span></span>
              <span class="act-meta">{{ a.date | date:'d MMM y' }} · added {{ timeAgo(a.created_at) }}</span>
            </span>
            <span class="act-figures">
              <span class="act-qty" *ngIf="a.quantity != null">{{ a.quantity | number }} bricks</span>
              <span class="act-amt" *ngIf="a.amount != null">&#8377;{{ a.amount | number:'1.0-0' }}</span>
            </span>
          </a>
        </li>
      </ul>
      <ng-template #noActivity>
        <div class="list-empty"><i class="fas fa-inbox me-2"></i>No records yet</div>
      </ng-template>
    </div>

    <!-- ============ STAT TILE TEMPLATE ============ -->
    <ng-template #tile let-t>
      <a class="card stats-card tile h-100" [routerLink]="t.link"
         [class.tile-good]="t.tone === 'good'" [class.tile-bad]="t.tone === 'bad'">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="card-label">{{ t.label }}</div>
            <div class="pipe-icon" [style.background-color]="t.color"><i class="fas" [ngClass]="t.icon"></i></div>
          </div>
          <div class="tile-value" [class.text-good]="t.tone === 'good'" [class.text-bad]="t.tone === 'bad'">
            <i *ngIf="t.tone === 'good'" class="fas fa-arrow-trend-up me-1 tone-icon"></i>
            <i *ngIf="t.tone === 'bad'" class="fas fa-arrow-trend-down me-1 tone-icon"></i>
            {{ t.value < 0 ? '−' : '' }}{{ t.prefix || '' }}{{ abs(t.value) | number:(t.format || '1.0-0') }}
          </div>
          <div class="meter mt-2 mb-1" *ngIf="t.meter != null" role="progressbar"
               [attr.aria-valuenow]="t.meter" aria-valuemin="0" aria-valuemax="100">
            <div class="meter-fill meter-good" [style.width.%]="t.meter"></div>
          </div>
          <div class="tile-hint">{{ t.hint }}</div>
          <div class="tile-sub" *ngIf="t.sub">{{ t.sub }}</div>
        </div>
      </a>
    </ng-template>
  `,
  styles: [`
    :host { --ink: #2c1810; --ink-soft: #6c5a50; --track: #efe6e0; --good: #1e8449; --bad: #c0392b; }

    .header-date { color: var(--ink-soft); font-size: 0.9rem; }

    .section-title {
      display: flex; align-items: center;
      color: #8B4513; font-weight: 700; font-size: 1rem;
      margin-bottom: 0.75rem; padding-bottom: 0.4rem;
      border-bottom: 2px solid #e8e0d8;
    }
    .section-link {
      margin-left: auto; font-size: 0.8rem; font-weight: 600;
      color: #c0392b; text-decoration: none;
    }
    .section-link:hover { color: #8B4513; text-decoration: underline; }

    /* --- shared tile bits --- */
    a.stats-card { display: block; color: inherit; text-decoration: none; }
    .tile-value {
      font-size: 1.7rem; font-weight: 700; color: var(--ink); line-height: 1.15;
      margin-top: 0.15rem; white-space: nowrap;
    }
    .tile-hint { font-size: 0.8rem; color: #888; margin-top: 0.2rem; }
    .tile-sub { font-size: 0.75rem; color: #aaa; }
    .pipe-icon {
      width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.15rem; color: #fff;
    }
    .text-good { color: var(--good); }
    .text-bad { color: var(--bad); }
    .tone-icon { font-size: 1.1rem; vertical-align: 0.15rem; }
    .tile-good { border-left: 4px solid var(--good); }
    .tile-bad { border-left: 4px solid var(--bad); }

    .meter { height: 6px; border-radius: 3px; background: var(--track); overflow: hidden; }
    .meter-fill { height: 100%; border-radius: 3px; background: #c0392b; transition: width 0.4s ease; }
    .meter-fill.meter-good { background: var(--good); }

    /* --- this month strip --- */
    .month-strip {
      background: linear-gradient(135deg, #2c1810 0%, #4a2418 100%);
      color: #fff; border-radius: 10px; padding: 14px 20px;
      display: flex; align-items: center; gap: 24px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
    }
    .month-title { font-weight: 700; font-size: 0.9rem; white-space: nowrap; }
    .month-name { display: block; font-weight: 400; font-size: 0.78rem; opacity: 0.75; margin-left: 1.55rem; }
    .month-items { display: flex; flex: 1; gap: 8px; justify-content: space-around; flex-wrap: wrap; }
    .month-item {
      color: #fff; text-decoration: none; padding: 4px 10px; border-radius: 8px; min-width: 110px;
      transition: background 0.2s ease;
    }
    .month-item:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
    .month-value { font-size: 1.25rem; font-weight: 700; line-height: 1.2; white-space: nowrap; }
    .month-unit { font-size: 0.8rem; font-weight: 500; opacity: 0.8; }
    .month-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.75; }

    /* --- pipeline --- */
    .pipeline { display: flex; align-items: stretch; gap: 6px; }
    .pipe-card { flex: 1 1 0; min-width: 0; }
    .pipe-arrow {
      display: flex; align-items: center; color: #c9b8ad; font-size: 0.9rem; flex: 0 0 auto;
    }

    /* --- kiln cards --- */
    .kiln-card { border-top: 4px solid #ccc; }
    .kiln-card.kiln-loading { border-top-color: #f39c12; }
    .kiln-card.kiln-firing { border-top-color: #c0392b; }
    .kiln-card.kiln-ready { border-top-color: #1e8449; }
    .kiln-card.kiln-empty { background: #faf7f5; }
    .kiln-card.kiln-empty:hover { transform: none; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); }
    .kiln-name { font-weight: 700; color: var(--ink); font-size: 1rem; }
    .kiln-card .badge-status { font-size: 0.7rem; }
    .kiln-stat {
      display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--ink-soft);
      padding: 3px 0; border-bottom: 1px solid #f3eee9;
    }
    .kiln-stat:last-of-type { border-bottom: none; }
    .kiln-stat strong { color: var(--ink); font-variant-numeric: tabular-nums; }
    .kiln-foot {
      display: flex; justify-content: space-between; gap: 8px;
      font-size: 0.72rem; color: #999; margin-top: 0.4rem;
    }
    .kiln-empty-text { font-size: 0.85rem; color: #999; padding: 0.5rem 0 0.25rem; }
    .kiln-empty-text a { color: #c0392b; font-weight: 600; text-decoration: none; }

    /* --- list cards --- */
    .list-card { display: flex; flex-direction: column; }
    .list-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; font-weight: 700; color: #8B4513; font-size: 0.9rem;
      border-bottom: 1px solid #f0e9e3;
    }
    .list-head a { font-size: 0.78rem; font-weight: 600; color: #c0392b; text-decoration: none; }
    .list-head a:hover { text-decoration: underline; }
    .list-table tbody td { padding: 9px 16px; border-color: #f3eee9; font-size: 0.88rem; }
    .list-table tbody tr:last-child td { border-bottom: none; }
    .list-name { font-weight: 600; color: var(--ink); }
    .list-sub { font-size: 0.74rem; color: #999; }
    .list-amount { font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .list-empty { padding: 28px 16px; text-align: center; color: #999; font-size: 0.88rem; }

    /* --- recent activity --- */
    .activity-list { list-style: none; margin: 0; padding: 0; }
    .activity-list li + li { border-top: 1px solid #f3eee9; }
    .activity-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 16px;
      color: inherit; text-decoration: none; transition: background 0.15s ease;
    }
    .activity-row:hover { background: rgba(192, 57, 43, 0.04); color: inherit; }
    .act-icon {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.85rem;
    }
    .act-production { background: #c0392b; }
    .act-kiln_loading { background: #e67e22; }
    .act-manufacture { background: #8B4513; }
    .act-sale { background: #2980b9; }
    .act-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .act-title { font-size: 0.9rem; font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .act-detail { font-weight: 400; color: var(--ink-soft); }
    .act-meta { font-size: 0.74rem; color: #999; }
    .act-figures { text-align: right; display: flex; flex-direction: column; flex-shrink: 0; }
    .act-qty { font-size: 0.85rem; color: var(--ink-soft); white-space: nowrap; }
    .act-amt { font-size: 0.9rem; font-weight: 700; color: var(--ink); white-space: nowrap; }

    /* --- responsive --- */
    @media (max-width: 1199px) {
      .pipeline { flex-wrap: wrap; }
      .pipe-card { flex: 1 1 30%; }
      .pipe-arrow { display: none; }
    }
    @media (max-width: 767px) {
      .month-strip { flex-direction: column; align-items: stretch; gap: 10px; padding: 12px 14px; }
      .month-name { display: inline; margin-left: 0.5rem; }
      .month-items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
      .month-item { min-width: 0; padding: 4px 6px; }
      .month-value { font-size: 1.05rem; }
      .pipe-card { flex: 1 1 45%; }
      .tile-value { font-size: 1.4rem; }
      .act-detail { display: none; }
    }
    @media (max-width: 575px) {
      .month-items { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  today = new Date();
  monthStart = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  loading = false;

  // Pipeline (brick quantities)
  totalProduced = 0;
  totalInKiln = 0;
  totalInFire = 0;
  totalReady = 0;
  totalSold = 0;
  totalSales = 0;

  // Revenue & collections
  totalRevenue = 0;
  avgPricePerBrick = 0;
  customerTotalAmount = 0;
  customerTotalPaid = 0;
  customerBalance = 0;
  customersWithBalance = 0;

  // Payables (employee ledger: balance = earned - paid + opening)
  wagesEarned = 0;
  wagesPaid = 0;
  wagesOpeningBalance = 0;
  wagesBalance = 0;
  employeesWithBalance = 0;
  huskTotalCost = 0;
  huskTotalPaid = 0;
  huskBalance = 0;
  huskPendingLoads = 0;

  thisMonth = { produced: 0, loaded: 0, sold: 0, revenue: 0, sales_count: 0, wages_paid: 0, husk_tonnage: 0, husk_cost: 0 };
  kilns: KilnStatus[] = [];
  topCustomers: any[] = [];
  topEmployees: any[] = [];
  activities: Activity[] = [];

  alertMessage = '';
  alertType = 'info';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get monthItems() {
    return [
      { label: 'Produced', value: this.thisMonth.produced, unit: 'bricks', link: '/production' },
      { label: 'Loaded', value: this.thisMonth.loaded, unit: 'bricks', link: '/kiln-loading' },
      { label: 'Sold', value: this.thisMonth.sold, unit: 'bricks', link: '/brick-sales' },
      { label: 'Revenue', value: this.thisMonth.revenue, prefix: '₹', link: '/brick-sales' },
      { label: 'Wages paid', value: this.thisMonth.wages_paid, prefix: '₹', link: '/employees' },
      { label: 'Husk bought', value: this.thisMonth.husk_tonnage, unit: 'tons', format: '1.0-1', link: '/husk-loads' }
    ];
  }

  get pipeline(): PipelineStage[] {
    return [
      { label: 'Produced', value: this.totalProduced, color: '#c0392b', icon: 'fa-cubes', hint: 'raw bricks made', link: '/production' },
      { label: 'In Kiln', value: this.totalInKiln, color: '#e67e22', icon: 'fa-layer-group', hint: 'loaded, not fired', link: '/kiln-loading' },
      { label: 'In Fire', value: this.totalInFire, color: '#8B4513', icon: 'fa-fire', hint: 'currently firing', link: '/kiln-manufacture' },
      { label: 'Ready Stock', value: this.totalReady, color: '#27ae60', icon: 'fa-check-circle', hint: 'available to sell', link: '/kiln-loading' },
      { label: 'Sold', value: this.totalSold, color: '#2980b9', icon: 'fa-shopping-cart', hint: 'all-time sold', link: '/brick-sales' }
    ];
  }

  get collectedPct(): number {
    if (!this.customerTotalAmount) return 0;
    return Math.min(100, Math.round((this.customerTotalPaid / this.customerTotalAmount) * 100));
  }

  get totalPayable(): number {
    return this.wagesBalance + this.huskBalance;
  }

  get netPosition(): number {
    return this.customerBalance - this.totalPayable;
  }

  get revenueTiles(): Tile[] {
    return [
      {
        label: 'Sales Revenue', value: this.totalRevenue, prefix: '₹',
        hint: `${this.fmt(this.totalSold)} bricks across ${this.fmt(this.totalSales)} sale${this.totalSales === 1 ? '' : 's'}`,
        icon: 'fa-rupee-sign', color: '#c0392b', link: '/brick-sales'
      },
      {
        label: 'Amount Collected', value: this.customerTotalPaid, prefix: '₹',
        meter: this.collectedPct,
        hint: `${this.collectedPct}% of ₹${this.fmt(this.customerTotalAmount)} billed`,
        icon: 'fa-check-double', color: '#27ae60', link: '/customers'
      },
      {
        label: 'Balance to Collect', value: this.customerBalance, prefix: '₹',
        hint: this.customersWithBalance > 0
          ? `from ${this.customersWithBalance} customer${this.customersWithBalance === 1 ? '' : 's'}`
          : 'nothing outstanding',
        icon: 'fa-hand-holding-usd', color: '#e67e22', link: '/customers'
      },
      {
        label: 'Avg Price / Brick', value: this.avgPricePerBrick, prefix: '₹', format: '1.2-2',
        hint: 'all-time average sale price',
        icon: 'fa-tag', color: '#2980b9', link: '/brick-sales'
      }
    ];
  }

  get expenseTiles(): Tile[] {
    const wageHint = `earned ₹${this.fmt(this.wagesEarned)} · paid ₹${this.fmt(this.wagesPaid)}`
      + (this.wagesOpeningBalance ? ` · opening ₹${this.fmt(this.wagesOpeningBalance)}` : '');
    const huskHint = this.huskBalance < 0
      ? `overpaid by ₹${this.fmt(-this.huskBalance)} on ₹${this.fmt(this.huskTotalCost)} cost`
      : `of ₹${this.fmt(this.huskTotalCost)} cost · ${this.huskPendingLoads} load${this.huskPendingLoads === 1 ? '' : 's'} pending`;
    return [
      {
        label: 'Wages Payable', value: this.wagesBalance, prefix: '₹',
        hint: wageHint,
        sub: this.employeesWithBalance > 0 ? `${this.employeesWithBalance} employee${this.employeesWithBalance === 1 ? '' : 's'} to pay` : undefined,
        icon: 'fa-money-bill-wave', color: '#c0392b', link: '/employees'
      },
      {
        label: 'Husk Payable', value: this.huskBalance, prefix: '₹',
        hint: huskHint,
        icon: 'fa-seedling', color: '#8B4513', link: '/husk-loads'
      },
      {
        label: 'Total to Pay', value: this.totalPayable, prefix: '₹',
        hint: 'wages + husk',
        icon: 'fa-balance-scale', color: '#8e44ad', link: '/wages-report'
      },
      {
        label: 'Net Position', value: this.netPosition, prefix: '₹',
        hint: 'to collect − to pay',
        tone: this.netPosition >= 0 ? 'good' : 'bad',
        icon: 'fa-scale-balanced', color: this.netPosition >= 0 ? '#1e8449' : '#c0392b', link: '/customers'
      }
    ];
  }

  soldPct(k: KilnStatus): number {
    if (!k.quantity_loaded) return 0;
    return Math.min(100, Math.round((k.quantity_sold / k.quantity_loaded) * 100));
  }

  kilnBadge(status: string): string {
    switch (status) {
      case 'loading': return 'bg-warning text-dark';
      case 'firing': return 'bg-danger';
      case 'ready': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  kilnIcon(status: string): string {
    switch (status) {
      case 'loading': return 'fa-truck-loading';
      case 'firing': return 'fa-fire';
      case 'ready': return 'fa-check';
      default: return 'fa-minus';
    }
  }

  kilnLabel(status: string): string {
    switch (status) {
      case 'loading': return 'Loading';
      case 'firing': return 'Firing';
      case 'ready': return 'Ready';
      default: return 'Empty';
    }
  }

  activityIcon(type: string): string {
    switch (type) {
      case 'production': return 'fa-industry';
      case 'kiln_loading': return 'fa-truck-loading';
      case 'manufacture': return 'fa-fire';
      case 'sale': return 'fa-shopping-cart';
      default: return 'fa-circle';
    }
  }

  activityLink(type: string): string {
    switch (type) {
      case 'production': return '/production';
      case 'kiln_loading': return '/kiln-loading';
      case 'manufacture': return '/kiln-manufacture';
      case 'sale': return '/brick-sales';
      default: return '/';
    }
  }

  timeAgo(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  abs(n: number): number {
    return Math.abs(n || 0);
  }

  // Same grouping as Angular's number pipe (en-US), so hints match tile values.
  private fmt(n: number): string {
    return Math.round(n || 0).toLocaleString('en-US');
  }

  loadDashboard(): void {
    this.loading = true;
    this.apiService.getDashboard().subscribe({
      next: (data) => {
        const s = data.summary || {};
        this.totalProduced = s.total_produced || 0;
        this.totalInKiln = s.total_in_kiln || 0;
        this.totalInFire = s.total_in_fire || 0;
        this.totalReady = s.total_ready || 0;
        this.totalSold = s.total_sold || 0;
        this.totalSales = s.total_sales || 0;
        this.totalRevenue = s.total_revenue || 0;
        this.avgPricePerBrick = s.avg_price_per_brick || 0;

        this.customerTotalAmount = s.customer_total_amount || 0;
        this.customerTotalPaid = s.customer_total_paid || 0;
        this.customerBalance = s.customer_balance || 0;
        this.customersWithBalance = s.customers_with_balance || 0;

        this.wagesEarned = s.wages_earned || 0;
        this.wagesPaid = s.wages_paid || 0;
        this.wagesOpeningBalance = s.wages_opening_balance || 0;
        this.wagesBalance = s.wages_balance || 0;
        this.employeesWithBalance = s.employees_with_balance || 0;
        this.huskTotalCost = s.husk_total_cost || 0;
        this.huskTotalPaid = s.husk_total_paid || 0;
        this.huskBalance = s.husk_balance || 0;
        this.huskPendingLoads = s.husk_pending_loads || 0;

        this.thisMonth = { ...this.thisMonth, ...(data.this_month || {}) };
        this.kilns = data.kilns || [];
        this.topCustomers = data.top_customers || [];
        this.topEmployees = data.top_employees || [];
        this.activities = data.recent_activities || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loading = false;
        this.alertMessage = 'Failed to load dashboard data';
        this.alertType = 'danger';
        setTimeout(() => this.alertMessage = '', 3000);
      }
    });
  }
}
