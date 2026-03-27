import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-old-records',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-archive me-2"></i>Old Records</h2>
    </div>

    <!-- Archive List -->
    <div *ngIf="!selectedArchive">
      <div class="row g-3">
        <div class="col-lg-4 col-md-6" *ngFor="let archive of archives">
          <div class="card" style="border: none; border-radius: 12px; box-shadow: 0 3px 15px rgba(0,0,0,0.1); cursor: pointer;"
            (click)="viewArchive(archive)">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 style="font-weight: 700; color: #8B4513; margin-bottom: 5px;">
                    <i class="fas fa-fire me-2"></i>Kiln {{ archive.kiln_number }}
                  </h5>
                  <small class="text-muted">
                    <i class="fas fa-calendar me-1"></i>Archived: {{ archive.archived_date | date:'mediumDate' }}
                  </small>
                  <div class="mt-2">
                    <span class="badge bg-info me-1">{{ archive.manufactures?.length || 0 }} manufactures</span>
                    <span class="badge bg-success">{{ archive.sales?.length || 0 }} sales</span>
                  </div>
                  <div class="mt-1" *ngIf="archive.kiln_loading?.quantity_loaded">
                    <small class="text-muted">{{ archive.kiln_loading.quantity_loaded | number }} bricks loaded</small>
                  </div>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(archive, $event)" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="archives.length === 0" class="empty-state">
        <i class="fas fa-archive d-block"></i>
        <p>No archived records yet</p>
        <p class="text-muted">Archive completed kilns from the Kiln Loading page</p>
      </div>
    </div>

    <!-- Archive Detail View -->
    <div *ngIf="selectedArchive">
      <button class="btn btn-outline-secondary mb-3" (click)="selectedArchive = null">
        <i class="fas fa-arrow-left me-1"></i> Back to Archives
      </button>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 style="color: #8B4513; font-weight: 700; margin: 0;">
          <i class="fas fa-fire me-2"></i>Kiln {{ selectedArchive.kiln_number }}
        </h4>
        <button class="btn btn-outline-danger btn-sm" (click)="downloadArchivePDF()">
          <i class="fas fa-file-pdf me-1"></i> Download PDF
        </button>
      </div>

      <small class="text-muted d-block mb-3">Archived on {{ selectedArchive.archived_date | date:'medium' }}</small>

      <!-- Kiln Loading Info -->
      <div class="card mb-3" style="border:none; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08);" *ngIf="selectedArchive.kiln_loading">
        <div class="card-header" style="background:#2c1810; color:#fff; border-radius:10px 10px 0 0; font-weight:600;">
          <i class="fas fa-truck-loading me-2"></i>Kiln Loading
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-6 mb-2"><strong>Qty Loaded:</strong> {{ selectedArchive.kiln_loading.quantity_loaded | number }}</div>
            <div class="col-6 mb-2"><strong>Date:</strong> {{ selectedArchive.kiln_loading.loading_date | date:'mediumDate' }}</div>
            <div class="col-6 mb-2"><strong>Status:</strong> {{ selectedArchive.kiln_loading.status }}</div>
            <div class="col-6 mb-2" *ngIf="selectedArchive.kiln_loading.employees?.length">
              <strong>Employees:</strong> {{ getEmpNames(selectedArchive.kiln_loading.employees) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Manufacture Records -->
      <div class="card mb-3" style="border:none; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08);" *ngIf="selectedArchive.manufactures?.length > 0">
        <div class="card-header" style="background:#8B4513; color:#fff; border-radius:10px 10px 0 0; font-weight:600;">
          <i class="fas fa-fire me-2"></i>Manufacture Records ({{ selectedArchive.manufactures.length }})
        </div>
        <div class="card-body p-0">
          <div class="table-container">
            <table class="table table-striped mb-0">
              <thead><tr><th>#</th><th>Work Type</th><th>Employees</th><th>Date</th><th>Wages</th></tr></thead>
              <tbody>
                <tr *ngFor="let m of selectedArchive.manufactures; let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ m.quality_grade }}</td>
                  <td>{{ getEmpNames(m.employees) }}</td>
                  <td>{{ m.manufacture_date | date:'mediumDate' }}</td>
                  <td>&#8377;{{ (m.total_wages || 0) | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sales Records -->
      <div class="card mb-3" style="border:none; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08);" *ngIf="selectedArchive.sales?.length > 0">
        <div class="card-header" style="background:#27ae60; color:#fff; border-radius:10px 10px 0 0; font-weight:600;">
          <i class="fas fa-shopping-cart me-2"></i>Sales Records ({{ selectedArchive.sales.length }})
        </div>
        <div class="card-body p-0">
          <div class="table-container">
            <table class="table table-striped mb-0">
              <thead><tr><th>#</th><th>Customer</th><th>Qty</th><th>Amount</th><th>Date</th><th>Payment</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of selectedArchive.sales; let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>{{ s.customer_id?.name || '-' }}</td>
                  <td>{{ (s.quantity_sold || 0) | number }}</td>
                  <td>&#8377;{{ (s.total_amount || 0) | number:'1.2-2' }}</td>
                  <td>{{ s.sale_date | date:'mediumDate' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'bg-success': s.payment_status === 'paid',
                      'bg-warning text-dark': s.payment_status === 'partial',
                      'bg-danger': s.payment_status === 'pending'
                    }">{{ s.payment_status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div *ngIf="showDeleteConfirm">
      <div class="modal-backdrop-custom" (click)="showDeleteConfirm = false"></div>
      <div class="modal-custom">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">Delete Archive</h5>
              <button type="button" class="btn-close" (click)="showDeleteConfirm = false"></button>
            </div>
            <div class="modal-body">
              <p>Delete archived data for <strong>Kiln {{ deletingArchive?.kiln_number }}</strong>?</p>
              <p class="text-muted mb-0">This cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showDeleteConfirm = false">Cancel</button>
              <button class="btn btn-danger" (click)="deleteArchive()">
                <i class="fas fa-trash me-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OldRecordsComponent implements OnInit {
  archives: any[] = [];
  selectedArchive: any = null;
  showDeleteConfirm = false;
  deletingArchive: any = null;
  alertMessage = '';
  alertType = 'success';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getArchives().subscribe({
      next: (data) => this.archives = data,
      error: () => this.showAlert('Failed to load archives', 'danger')
    });
  }

  viewArchive(archive: any): void {
    this.apiService.getArchive(archive._id).subscribe({
      next: (data) => this.selectedArchive = data,
      error: () => this.showAlert('Failed to load archive', 'danger')
    });
  }

  getEmpNames(employees: any[]): string {
    if (!employees || employees.length === 0) return '-';
    return employees.map(e => typeof e === 'object' ? e.name : e).filter(n => n).join(', ') || '-';
  }

  confirmDelete(archive: any, event: Event): void {
    event.stopPropagation();
    this.deletingArchive = archive;
    this.showDeleteConfirm = true;
  }

  deleteArchive(): void {
    if (!this.deletingArchive) return;
    this.apiService.deleteArchive(this.deletingArchive._id).subscribe({
      next: () => {
        this.showAlert('Archive deleted', 'success');
        this.showDeleteConfirm = false;
        this.deletingArchive = null;
        this.loadData();
      },
      error: () => this.showAlert('Failed to delete', 'danger')
    });
  }

  downloadArchivePDF(): void {
    const a = this.selectedArchive;
    if (!a) return;
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '-';
    let html = `<html><head><title>Kiln ${a.kiln_number} - Archive</title><style>
      body{font-family:Arial,sans-serif;padding:20px;} h1{color:#8B4513;font-size:1.5rem;}
      h2{color:#555;font-size:1.1rem;margin-top:20px;}
      table{width:100%;border-collapse:collapse;margin-top:10px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:0.85rem;}
      th{background:#2c1810;color:#fff;} tr:nth-child(even){background:#f9f9f9;}
      .info{margin:10px 0;font-size:0.9rem;} .info strong{color:#555;}
    </style></head><body>
    <h1>Kiln ${a.kiln_number} - Archived Record</h1>
    <p style="color:#666;font-size:0.85rem;">Archived: ${formatDate(a.archived_date)}</p>`;

    if (a.kiln_loading) {
      html += `<h2>Kiln Loading</h2>
      <div class="info"><strong>Qty Loaded:</strong> ${(a.kiln_loading.quantity_loaded||0).toLocaleString()} | <strong>Date:</strong> ${formatDate(a.kiln_loading.loading_date)} | <strong>Status:</strong> ${a.kiln_loading.status}</div>`;
    }

    if (a.manufactures?.length > 0) {
      html += `<h2>Manufacture Records (${a.manufactures.length})</h2>
      <table><tr><th>#</th><th>Work Type</th><th>Employees</th><th>Date</th><th>Wages</th></tr>`;
      a.manufactures.forEach((m: any, i: number) => {
        html += `<tr><td>${i+1}</td><td>${m.quality_grade}</td><td>${this.getEmpNames(m.employees)}</td>
          <td>${formatDate(m.manufacture_date)}</td><td>Rs.${(m.total_wages||0).toFixed(2)}</td></tr>`;
      });
      html += `</table>`;
    }

    if (a.sales?.length > 0) {
      let totalSales = 0;
      html += `<h2>Sales Records (${a.sales.length})</h2>
      <table><tr><th>#</th><th>Customer</th><th>Qty</th><th>Amount</th><th>Date</th><th>Payment</th></tr>`;
      a.sales.forEach((s: any, i: number) => {
        totalSales += s.total_amount || 0;
        html += `<tr><td>${i+1}</td><td>${s.customer_id?.name||'-'}</td><td>${(s.quantity_sold||0).toLocaleString()}</td>
          <td>Rs.${(s.total_amount||0).toFixed(2)}</td><td>${formatDate(s.sale_date)}</td><td>${s.payment_status}</td></tr>`;
      });
      html += `</table><p style="font-weight:bold;margin-top:10px;">Total Sales: Rs.${totalSales.toFixed(2)}</p>`;
    }

    html += `</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 3000);
  }
}
