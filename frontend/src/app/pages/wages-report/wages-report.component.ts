import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-wages-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-file-invoice-dollar me-2"></i>Wages Report</h2>
    </div>

    <!-- Filter Section -->
    <div class="card mb-4" style="border: none; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
      <div class="card-body">
        <form [formGroup]="filterForm" class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="form-label">Employee</label>
            <select class="form-select" formControlName="employee_id">
              <option value="">All Employees</option>
              <option *ngFor="let emp of employees" [value]="emp._id">
                {{ emp.name }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <button class="btn btn-brick w-100" (click)="generateReport()">
              <i class="fas fa-search me-1"></i> Generate Report
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row g-4 mb-4" *ngIf="reportGenerated">
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Production Wages</div>
                <div class="card-value" style="color: #c0392b;">&#8377;{{ totalProductionWages | number:'1.2-2' }}</div>
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
                <div class="card-label mb-1">Loading Wages</div>
                <div class="card-value" style="color: #e67e22;">&#8377;{{ totalLoadingWages | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #e67e22;"><i class="fas fa-truck-loading"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Kiln Work Wages</div>
                <div class="card-value" style="color: #8B4513;">&#8377;{{ totalManufacturingWages | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon bg-brick-brown"><i class="fas fa-fire"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Brick Load Wages</div>
                <div class="card-value" style="color: #2c3e50;">&#8377;{{ totalBrickLoadWages | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #2c3e50;"><i class="fas fa-truck"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row g-4 mb-4" *ngIf="reportGenerated">
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Grand Total</div>
                <div class="card-value text-brick-red">&#8377;{{ grandTotal | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon bg-brick-red"><i class="fas fa-rupee-sign"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Table -->
    <div class="table-container" *ngIf="reportGenerated">
      <table class="table table-striped table-hover" *ngIf="reportData.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Employee Name</th>
            <th>Production</th>
            <th>Loading</th>
            <th>Kiln Work</th>
            <th>Brick Load</th>
            <th>Total</th>
            <th>Paid (&#8377;)</th>
            <th>Balance (&#8377;)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let row of reportData; let i = index">
            <tr>
              <td>{{ i + 1 }}</td>
              <td><strong>{{ row.employee_name }}</strong></td>
              <td>{{ row.total_production_wages | number:'1.2-2' }}</td>
              <td>{{ row.total_loading_wages | number:'1.2-2' }}</td>
              <td>{{ row.total_manufacturing_wages | number:'1.2-2' }}</td>
              <td>{{ row.total_brick_load_wages | number:'1.2-2' }}</td>
              <td><strong>{{ row.grand_total | number:'1.2-2' }}</strong></td>
              <td>{{ row.total_paid | number:'1.2-2' }}</td>
              <td [ngStyle]="{'color': row.balance > 0 ? '#198754' : row.balance < 0 ? '#dc3545' : '#333'}">
                <strong>{{ row.balance | number:'1.2-2' }}</strong>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="toggleDetails(i)" title="Details">
                  <i class="fas" [ngClass]="expandedRow === i ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="downloadPDF(row)" title="Download PDF">
                  <i class="fas fa-file-pdf"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="expandedRow === i" style="background-color: #f8f9fa;">
              <td colspan="10">
                <div class="p-2">
                  <!-- Production Details -->
                  <h6 *ngIf="row.production_details?.length > 0" class="mb-2" style="color: #c0392b;">
                    <i class="fas fa-cubes me-1"></i>Brick Production Entries
                  </h6>
                  <table class="table table-sm mb-3" *ngIf="row.production_details?.length > 0">
                    <thead><tr><th>Date</th><th>Batch</th><th>Qty</th><th>Rate</th><th>Wages</th></tr></thead>
                    <tbody>
                      <tr *ngFor="let d of row.production_details">
                        <td>{{ d.production_date | date:'mediumDate' }}</td>
                        <td>{{ d.batch_number }}</td>
                        <td>{{ d.quantity | number }}</td>
                        <td>&#8377;1.10</td>
                        <td>&#8377;{{ d.wages_earned | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Loading Details -->
                  <h6 *ngIf="row.loading_details?.length > 0" class="mb-2" style="color: #e67e22;">
                    <i class="fas fa-truck-loading me-1"></i>Kiln Loading Entries
                  </h6>
                  <table class="table table-sm mb-3" *ngIf="row.loading_details?.length > 0">
                    <thead><tr><th>Date</th><th>Kiln</th><th>Qty</th><th>Workers</th><th>Wages</th></tr></thead>
                    <tbody>
                      <tr *ngFor="let d of row.loading_details">
                        <td>{{ d.loading_date | date:'mediumDate' }}</td>
                        <td>Kiln {{ d.kiln_number }}</td>
                        <td>{{ d.quantity_loaded | number }}</td>
                        <td>{{ d.employees_count }}</td>
                        <td>&#8377;{{ d.wages_earned | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Manufacturing Details -->
                  <h6 *ngIf="row.manufacturing_details?.length > 0" class="mb-2" style="color: #8B4513;">
                    <i class="fas fa-fire me-1"></i>Manufacturing Entries
                  </h6>
                  <table class="table table-sm mb-0" *ngIf="row.manufacturing_details?.length > 0">
                    <thead><tr><th>Date</th><th>Work Type</th><th>Workers</th><th>Wages</th></tr></thead>
                    <tbody>
                      <tr *ngFor="let d of row.manufacturing_details">
                        <td>{{ d.manufacture_date | date:'mediumDate' }}</td>
                        <td>{{ d.work_type }}</td>
                        <td>{{ d.employees_count }}</td>
                        <td>&#8377;{{ d.wages_earned | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Brick Load Details -->
                  <h6 *ngIf="row.brick_load_details?.length > 0" class="mb-2" style="color: #2c3e50;">
                    <i class="fas fa-truck me-1"></i>Brick Load Entries (Driver/Helper)
                  </h6>
                  <table class="table table-sm mb-3" *ngIf="row.brick_load_details?.length > 0">
                    <thead><tr><th>Date</th><th>Customer</th><th>Qty</th><th>Role</th><th>Wages</th></tr></thead>
                    <tbody>
                      <tr *ngFor="let d of row.brick_load_details">
                        <td>{{ d.sale_date | date:'mediumDate' }}</td>
                        <td>{{ d.customer }}</td>
                        <td>{{ d.quantity | number }}</td>
                        <td><span class="badge" [ngClass]="d.role === 'Driver' ? 'bg-primary' : 'bg-secondary'">{{ d.role }}</span></td>
                        <td>&#8377;{{ d.wages_earned | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Payment History -->
                  <h6 *ngIf="row.payment_history?.length > 0" class="mb-2" style="color: #198754;">
                    <i class="fas fa-money-bill-wave me-1"></i>Payment History
                  </h6>
                  <table class="table table-sm mb-3" *ngIf="row.payment_history?.length > 0">
                    <thead><tr><th>Date</th><th>Time</th><th>Amount Paid</th><th>Running Balance</th></tr></thead>
                    <tbody>
                      <tr *ngFor="let p of getPaymentHistoryWithBalance(row)">
                        <td>{{ p.paid_at | date:'mediumDate' }}</td>
                        <td>{{ p.paid_at | date:'h:mm:ss a' }}</td>
                        <td style="color: #198754;"><strong>&#8377;{{ p.amount | number:'1.2-2' }}</strong></td>
                        <td [ngStyle]="{'color': p.running_balance > 0 ? '#198754' : p.running_balance < 0 ? '#dc3545' : '#333'}">
                          <strong>&#8377;{{ p.running_balance | number:'1.2-2' }}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div *ngIf="!row.production_details?.length && !row.loading_details?.length && !row.manufacturing_details?.length && !row.brick_load_details?.length && !row.payment_history?.length" class="text-muted">
                    No detailed entries available
                  </div>
                </div>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>
      <div *ngIf="reportData.length === 0" class="empty-state">
        <i class="fas fa-file-invoice d-block"></i>
        <p>No wages data found for the selected criteria</p>
      </div>
    </div>

    <div *ngIf="!reportGenerated" class="empty-state">
      <i class="fas fa-chart-bar d-block"></i>
      <p>Select date range and click "Generate Report" to view wages data</p>
    </div>
  `
})
export class WagesReportComponent implements OnInit {
  employees: any[] = [];
  reportData: any[] = [];
  reportGenerated = false;
  expandedRow: number | null = null;
  alertMessage = '';
  alertType = 'success';

  totalProductionWages = 0;
  totalLoadingWages = 0;
  totalManufacturingWages = 0;
  totalBrickLoadWages = 0;
  grandTotal = 0;

  filterForm = new FormGroup({
    employee_id: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.apiService.getEmployees().subscribe({
      next: (data) => this.employees = data,
      error: () => {}
    });
  }

  generateReport(): void {
    const params: any = {};
    const fv = this.filterForm.value;
    if (fv.employee_id) params.employee_id = fv.employee_id;

    this.apiService.getWagesReport(params).subscribe({
      next: (data) => {
        this.reportData = data.wages || [];
        this.calculateTotals();
        this.reportGenerated = true;
        this.expandedRow = null;
      },
      error: () => this.showAlert('Failed to generate wages report', 'danger')
    });
  }

  calculateTotals(): void {
    this.totalProductionWages = this.reportData.reduce((s, r) => s + (r.total_production_wages || 0), 0);
    this.totalLoadingWages = this.reportData.reduce((s, r) => s + (r.total_loading_wages || 0), 0);
    this.totalManufacturingWages = this.reportData.reduce((s, r) => s + (r.total_manufacturing_wages || 0), 0);
    this.totalBrickLoadWages = this.reportData.reduce((s, r) => s + (r.total_brick_load_wages || 0), 0);
    this.grandTotal = this.totalProductionWages + this.totalLoadingWages + this.totalManufacturingWages + this.totalBrickLoadWages;
  }

  toggleDetails(index: number): void {
    this.expandedRow = this.expandedRow === index ? null : index;
  }

  getPaymentHistoryWithBalance(row: any): any[] {
    if (!row.payment_history || row.payment_history.length === 0) return [];
    let runningBalance = (row.total_wages_earned || row.grand_total || 0) + (row.old_balance || 0);
    return row.payment_history.map((p: any) => {
      runningBalance -= p.amount;
      return { ...p, running_balance: runningBalance };
    });
  }

  downloadPDF(row: any): void {
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '-';
    const formatNum = (n: number) => (n || 0).toFixed(2);
    const getDateKey = (d: string) => d ? new Date(d).toISOString().substring(0, 10) : '';

    // Combine all entries into one list grouped by date
    const allEntries: any[] = [];

    for (const d of (row.production_details || [])) {
      allEntries.push({ date: getDateKey(d.production_date), type: 'Brick Production', detail: `Batch ${d.batch_number} - ${(d.quantity || 0).toLocaleString()} bricks`, wages: d.wages_earned });
    }
    for (const d of (row.loading_details || [])) {
      allEntries.push({ date: getDateKey(d.loading_date), type: 'Kiln Loading', detail: `Kiln ${d.kiln_number} - ${(d.quantity_loaded || 0).toLocaleString()} bricks (${d.employees_count} workers)`, wages: d.wages_earned });
    }
    for (const d of (row.manufacturing_details || [])) {
      allEntries.push({ date: getDateKey(d.manufacture_date), type: d.work_type || 'Kiln Work', detail: `${d.employees_count} workers`, wages: d.wages_earned });
    }
    for (const d of (row.brick_load_details || [])) {
      allEntries.push({ date: getDateKey(d.sale_date), type: `Brick Load (${d.role})`, detail: `${d.customer || '-'} - ${(d.quantity || 0).toLocaleString()} bricks`, wages: d.wages_earned });
    }

    // Sort by date
    allEntries.sort((a, b) => a.date.localeCompare(b.date));

    // Group by date
    const grouped: { [key: string]: { entries: any[], totalWages: number } } = {};
    for (const e of allEntries) {
      if (!grouped[e.date]) grouped[e.date] = { entries: [], totalWages: 0 };
      grouped[e.date].entries.push(e);
      grouped[e.date].totalWages += e.wages;
    }

    let html = `
    <html><head><title>Wages Report - ${row.employee_name}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
      h1 { color: #8B4513; border-bottom: 3px solid #c0392b; padding-bottom: 10px; }
      h2 { color: #555; margin-top: 25px; font-size: 16px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; font-size: 13px; }
      th { background: #2c1810; color: #fff; padding: 8px 10px; text-align: left; }
      td { padding: 7px 10px; border-bottom: 1px solid #ddd; }
      tr:nth-child(even) { background: #f9f6f3; }
      .summary { background: #f4f1ee; padding: 15px; border-radius: 8px; margin: 15px 0; }
      .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
      .summary-label { font-weight: bold; color: #555; }
      .total-row { border-top: 2px solid #8B4513; font-weight: bold; font-size: 15px; margin-top: 5px; padding-top: 8px; }
      .header-info { color: #777; font-size: 13px; margin-bottom: 20px; }
      .date-header { background: #e8e0d8; padding: 6px 10px; font-weight: bold; color: #8B4513; }
      .day-total { background: #f4f1ee; font-weight: bold; }
      .payment-section { margin-top: 30px; border-top: 2px solid #8B4513; padding-top: 15px; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <h1>Wages Report</h1>
    <div class="header-info">
      <strong>Employee:</strong> ${row.employee_name}<br>
      <strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </div>

    <div class="summary">
      <div class="summary-row"><span class="summary-label">Brick Production Wages:</span><span>Rs. ${formatNum(row.total_production_wages)}</span></div>
      <div class="summary-row"><span class="summary-label">Kiln Loading Wages:</span><span>Rs. ${formatNum(row.total_loading_wages)}</span></div>
      <div class="summary-row"><span class="summary-label">Kiln Work Wages:</span><span>Rs. ${formatNum(row.total_manufacturing_wages)}</span></div>
      <div class="summary-row"><span class="summary-label">Brick Load Wages:</span><span>Rs. ${formatNum(row.total_brick_load_wages)}</span></div>
      <div class="summary-row total-row"><span>Total Wages Earned:</span><span>Rs. ${formatNum(row.grand_total)}</span></div>
      <div class="summary-row"><span class="summary-label">Total Paid:</span><span>Rs. ${formatNum(row.total_paid)}</span></div>
      <div class="summary-row total-row"><span>Balance Due:</span><span style="color: ${row.balance > 0 ? '#198754' : row.balance < 0 ? '#dc3545' : '#333'}">Rs. ${formatNum(row.balance)}</span></div>
    </div>

    <h2>Daily Breakdown</h2>
    <table>
      <tr><th>Date</th><th>Work Type</th><th>Details</th><th>Wages</th></tr>`;

    const sortedDates = Object.keys(grouped).sort();
    for (const date of sortedDates) {
      const group = grouped[date];
      const dateStr = formatDate(date);

      if (group.entries.length === 1) {
        const e = group.entries[0];
        html += `<tr><td><strong>${dateStr}</strong></td><td>${e.type}</td><td>${e.detail}</td><td>Rs. ${formatNum(e.wages)}</td></tr>`;
      } else {
        // Multiple entries on same date - show date once, list all, then day total
        html += `<tr class="date-header"><td colspan="4">${dateStr}</td></tr>`;
        for (const e of group.entries) {
          html += `<tr><td></td><td>${e.type}</td><td>${e.detail}</td><td>Rs. ${formatNum(e.wages)}</td></tr>`;
        }
        html += `<tr class="day-total"><td></td><td colspan="2" style="text-align:right;">Day Total:</td><td>Rs. ${formatNum(group.totalWages)}</td></tr>`;
      }
    }

    html += `</table>`;

    // Payment History section
    const paymentHistory = row.payment_history || [];
    if (paymentHistory.length > 0) {
      html += `<h2>Payment History</h2>
      <table>
        <tr><th>Date</th><th>Time</th><th>Amount Paid</th><th>Running Balance</th></tr>`;

      let runningBalance = (row.total_wages_earned || row.grand_total || 0) + (row.old_balance || 0);
      for (const p of paymentHistory) {
        const paidDate = new Date(p.paid_at);
        const dateStr = paidDate.toLocaleDateString('en-IN');
        const timeStr = paidDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        runningBalance -= p.amount;
        html += `<tr>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td style="color: #198754; font-weight: bold;">Rs. ${formatNum(p.amount)}</td>
          <td style="color: ${runningBalance > 0 ? '#198754' : runningBalance < 0 ? '#dc3545' : '#333'}; font-weight: bold;">Rs. ${formatNum(runningBalance)}</td>
        </tr>`;
      }
      html += `</table>`;
    }

    html += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    }
  }

  showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 3000);
  }
}
