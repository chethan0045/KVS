import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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

    <!-- ============ CHARTS ============ -->
    <h5 class="section-title"><i class="fas fa-chart-line me-2"></i>Insights</h5>
    <div class="row g-3 mb-4">
      <!-- Monthly trend (line) -->
      <div class="col-lg-8">
        <div class="card chart-card h-100">
          <div class="card-body">
            <div class="chart-title">Production vs Sales — last 6 months</div>
            <div class="chart-wrap" style="height: 280px;">
              <canvas #trendCanvas></canvas>
            </div>
          </div>
        </div>
      </div>
      <!-- Pipeline (bar) -->
      <div class="col-lg-4">
        <div class="card chart-card h-100">
          <div class="card-body">
            <div class="chart-title">Brick Pipeline</div>
            <div class="chart-wrap" style="height: 280px;">
              <canvas #pipelineCanvas></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row g-3 mb-4">
      <!-- Collections (doughnut) -->
      <div class="col-lg-6">
        <div class="card chart-card h-100">
          <div class="card-body">
            <div class="chart-title">Collections</div>
            <div class="chart-wrap" style="height: 260px;">
              <canvas #collectionsCanvas></canvas>
            </div>
          </div>
        </div>
      </div>
      <!-- Payables (doughnut) -->
      <div class="col-lg-6">
        <div class="card chart-card h-100">
          <div class="card-body">
            <div class="chart-title">Payables</div>
            <div class="chart-wrap" style="height: 260px;">
              <canvas #payablesCanvas></canvas>
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
    .chart-card {
      border: none;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    .chart-title {
      font-weight: 700;
      color: #8B4513;
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
    }
    .chart-wrap {
      position: relative;
      width: 100%;
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pipelineCanvas') pipelineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('collectionsCanvas') collectionsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('payablesCanvas') payablesCanvas!: ElementRef<HTMLCanvasElement>;

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

  private viewReady = false;
  private summaryLoaded = false;
  private trendData: any = null;
  private charts: Chart[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadTrend();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryRenderCharts();
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
        this.summaryLoaded = true;
        this.tryRenderCharts();
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.alertMessage = 'Failed to load dashboard data';
        this.alertType = 'danger';
        setTimeout(() => this.alertMessage = '', 3000);
      }
    });
  }

  loadTrend(): void {
    this.apiService.getDashboardTrend(6).subscribe({
      next: (data) => {
        this.trendData = data;
        this.tryRenderCharts();
      },
      error: (err) => console.error('Error loading trend:', err)
    });
  }

  private tryRenderCharts(): void {
    if (!this.viewReady) return;
    if (this.summaryLoaded) {
      this.renderPipelineChart();
      this.renderCollectionsChart();
      this.renderPayablesChart();
    }
    if (this.trendData) {
      this.renderTrendChart();
    }
  }

  private renderTrendChart(): void {
    if (!this.trendCanvas) return;
    this.destroyChart('trend');
    const d = this.trendData;
    const chart = new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: d.labels,
        datasets: [
          {
            label: 'Produced', data: d.produced, borderColor: '#c0392b',
            backgroundColor: 'rgba(192,57,43,0.1)', fill: true, tension: 0.3, pointRadius: 3
          },
          {
            label: 'Sold', data: d.sold, borderColor: '#2980b9',
            backgroundColor: 'rgba(41,128,185,0.1)', fill: true, tension: 0.3, pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => Number(v).toLocaleString() } } }
      }
    });
    this.charts.push(chart);
  }

  private renderPipelineChart(): void {
    if (!this.pipelineCanvas) return;
    this.destroyChart('pipeline');
    const chart = new Chart(this.pipelineCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Produced', 'In Kiln', 'In Fire', 'Ready', 'Sold'],
        datasets: [{
          label: 'Bricks',
          data: [this.totalProduced, this.totalInKiln, this.totalInFire, this.totalReady, this.totalSold],
          backgroundColor: ['#c0392b', '#e67e22', '#8B4513', '#27ae60', '#2980b9']
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => Number(v).toLocaleString() } } }
      }
    });
    this.charts.push(chart);
  }

  private renderCollectionsChart(): void {
    if (!this.collectionsCanvas) return;
    this.destroyChart('collections');
    const chart = new Chart(this.collectionsCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Collected', 'Balance to Collect'],
        datasets: [{
          data: [this.customerTotalPaid, Math.max(0, this.customerBalance)],
          backgroundColor: ['#27ae60', '#dc3545']
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (c) => `${c.label}: ₹${Number(c.raw).toLocaleString()}` } }
        }
      }
    });
    this.charts.push(chart);
  }

  private renderPayablesChart(): void {
    if (!this.payablesCanvas) return;
    this.destroyChart('payables');
    const chart = new Chart(this.payablesCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Wages to Pay', 'Husk to Pay'],
        datasets: [{
          data: [Math.max(0, this.wagesBalance), Math.max(0, this.huskBalance)],
          backgroundColor: ['#c0392b', '#8B4513']
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (c) => `${c.label}: ₹${Number(c.raw).toLocaleString()}` } }
        }
      }
    });
    this.charts.push(chart);
  }

  // Destroy any existing Chart bound to this canvas before re-rendering,
  // so repeated data loads don't stack instances on the same element.
  private destroyChart(tag: string): void {
    const canvas = this.canvasFor(tag);
    if (!canvas) return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
  }

  private canvasFor(tag: string): HTMLCanvasElement | undefined {
    switch (tag) {
      case 'trend': return this.trendCanvas?.nativeElement;
      case 'pipeline': return this.pipelineCanvas?.nativeElement;
      case 'collections': return this.collectionsCanvas?.nativeElement;
      case 'payables': return this.payablesCanvas?.nativeElement;
      default: return undefined;
    }
  }
}
