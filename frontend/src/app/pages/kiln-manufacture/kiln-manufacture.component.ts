import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-kiln-manufacture',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-fire me-2"></i>Kilns &amp; Manufactured Bricks</h2>
      <div>
        <button class="btn btn-outline-danger me-2" (click)="downloadPDF()" *ngIf="manufactures.length > 0">
          <i class="fas fa-file-pdf me-1"></i> PDF
        </button>
        <button class="btn btn-brick" (click)="openModal()">
          <i class="fas fa-plus me-1"></i> Add Manufacture Record
        </button>
      </div>
    </div>

    <!-- 4 Kiln Visual Cards -->
    <div class="row g-4 mb-4">
      <div class="col-lg-3 col-md-6" *ngFor="let kilnNum of [1,2,3,4]">
        <div class="card kiln-card" [ngClass]="getKilnCardClass(kilnNum)"
          style="border: none; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.1);">
          <div class="card-body text-center" style="padding: 20px;">
            <!-- Kiln Icon -->
            <div style="font-size: 3rem; margin-bottom: 10px;">
              <i class="fas" [ngClass]="{
                'fa-box': getKilnStatus(kilnNum) === 'empty',
                'fa-truck-loading': getKilnStatus(kilnNum) === 'loading',
                'fa-fire': getKilnStatus(kilnNum) === 'firing',
                'fa-check-circle': getKilnStatus(kilnNum) === 'ready'
              }" [ngStyle]="{'color': getKilnIconColor(kilnNum)}"></i>
            </div>
            <h5 style="font-weight: 700; margin-bottom: 5px;">Kiln {{ kilnNum }}</h5>

            <!-- Bricks count -->
            <div *ngIf="getKilnLoading(kilnNum) as kl" style="margin: 10px 0;">
              <div style="font-size: 1.6rem; font-weight: 700; color: #333;">
                {{ (kl.quantity_loaded - (kl.quantity_sold || 0)) | number }}
              </div>
              <small class="text-muted">bricks remaining</small>
              <div *ngIf="kl.quantity_sold > 0">
                <small class="text-muted">{{ kl.quantity_loaded | number }} loaded | {{ kl.quantity_sold | number }} sold</small>
              </div>

              <!-- Status Badge -->
              <div style="margin-top: 10px;">
                <span class="badge badge-status" style="font-size: 0.85rem; padding: 6px 16px;"
                  [ngClass]="{
                    'bg-warning text-dark': kl.status === 'loading',
                    'bg-danger': kl.status === 'firing',
                    'bg-success': kl.status === 'ready'
                  }">
                  {{ kl.status | titlecase }}
                </span>
              </div>

              <!-- Status Update Buttons -->
              <div style="margin-top: 12px; display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-sm btn-outline-warning" *ngIf="kl.status !== 'loading'"
                  (click)="updateStatus(kl._id, 'loading')">
                  <i class="fas fa-truck-loading me-1"></i>Loading
                </button>
                <button class="btn btn-sm btn-outline-danger" *ngIf="kl.status !== 'firing'"
                  (click)="updateStatus(kl._id, 'firing')">
                  <i class="fas fa-fire me-1"></i>Firing
                </button>
                <button class="btn btn-sm btn-outline-success" *ngIf="kl.status !== 'ready'"
                  (click)="updateStatus(kl._id, 'ready')">
                  <i class="fas fa-check me-1"></i>Ready
                </button>
                <button class="btn btn-sm btn-info text-white" *ngIf="kl.status === 'ready'"
                  (click)="archiveKiln(kl)">
                  <i class="fas fa-archive me-1"></i>Archive
                </button>
              </div>
            </div>

            <div *ngIf="!getKilnLoading(kilnNum)" style="margin: 10px 0;">
              <div style="font-size: 1.2rem; color: #aaa;">Empty</div>
              <small class="text-muted">No bricks loaded</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manufacture Records Table -->
    <h4 style="color: #8B4513; font-weight: 700; margin-bottom: 15px;">
      <i class="fas fa-list me-2"></i>Manufacture Records
    </h4>
    <div class="table-container">
      <table class="table table-striped table-hover" *ngIf="manufactures.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Kiln No.</th>
            <th>Work Type</th>
            <th>Employees</th>
            <th>Date</th>
            <th>Wages (&#8377;)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of manufactures; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>Kiln {{ getKilnNumber(item.kiln_loading_id) }}</strong></td>
            <td>
              <span class="badge badge-status"
                [ngClass]="{
                  'bg-warning text-dark': item.quality_grade === 'Husk Loading',
                  'bg-info': item.quality_grade === 'DBA',
                  'bg-secondary': item.quality_grade === 'Wall',
                  'bg-primary': item.quality_grade === 'Cleaning'
                }">
                {{ item.quality_grade }}
              </span>
            </td>
            <td>
              <span class="badge bg-info" *ngIf="getEmployeeIds(item).length > 0">
                {{ getEmployeeIds(item).length }} employee{{ getEmployeeIds(item).length > 1 ? 's' : '' }}
              </span>
              <span *ngIf="getEmployeeIds(item).length === 0">-</span>
            </td>
            <td>{{ item.manufacture_date | date:'mediumDate' }}</td>
            <td>
              <strong>&#8377;{{ (item.total_wages || 0) | number:'1.2-2' }}</strong>
              <br *ngIf="getEmployeeIds(item).length > 0">
              <small *ngIf="getEmployeeIds(item).length > 0" class="text-muted">
                &#8377;{{ getPerEmployeeWage(item.total_wages || 0, getEmployeeIds(item).length) | number:'1.2-2' }}/person
              </small>
            </td>
            <td>
              <button class="btn btn-warning btn-sm me-1" (click)="openModal(item)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm" (click)="confirmDelete(item)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="manufactures.length === 0" class="empty-state">
        <i class="fas fa-industry d-block"></i>
        <p>No manufacture records found</p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div *ngIf="showModal">
      <div class="modal-backdrop-custom" (click)="closeModal()"></div>
      <div class="modal-custom">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingItem ? 'Edit' : 'Add' }} Manufacture Record</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
              <form [formGroup]="form">
                <div class="mb-3">
                  <label class="form-label">Kiln *</label>
                  <select class="form-select" formControlName="kiln_loading_id"
                    [ngClass]="{'is-invalid': form.get('kiln_loading_id')?.touched && form.get('kiln_loading_id')?.invalid}">
                    <option value="">Select kiln</option>
                    <option *ngFor="let kl of kilnLoadings" [value]="kl._id">
                      Kiln {{ kl.kiln_number }} - {{ kl.quantity_loaded | number }} bricks ({{ kl.status }})
                    </option>
                  </select>
                  <div class="invalid-feedback">Kiln is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Work Type *</label>
                  <select class="form-select" formControlName="quality_grade"
                    [ngClass]="{'is-invalid': form.get('quality_grade')?.touched && form.get('quality_grade')?.invalid}">
                    <option value="">Select work type</option>
                    <option value="Husk Loading">Husk Loading</option>
                    <option value="DBA">DBA</option>
                    <option value="Wall">Wall</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                  <div class="invalid-feedback">Work type is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Employees</label>
                  <div style="max-height: 150px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 6px; padding: 8px;">
                    <div *ngFor="let emp of employees; trackBy: trackByEmployeeId" class="form-check">
                      <input class="form-check-input" type="checkbox"
                        [id]="'mfg-emp-' + emp._id"
                        [checked]="isEmployeeSelected(emp._id)"
                        (change)="toggleEmployee(emp._id)">
                      <label class="form-check-label" [for]="'mfg-emp-' + emp._id">
                        {{ emp.name }}
                      </label>
                    </div>
                    <div *ngIf="employees.length === 0" class="text-muted small">No employees found</div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Manufacture Date *</label>
                  <input type="date" class="form-control" formControlName="manufacture_date"
                    [ngClass]="{'is-invalid': form.get('manufacture_date')?.touched && form.get('manufacture_date')?.invalid}">
                  <div class="invalid-feedback">Manufacture date is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Total Wages (&#8377;) *</label>
                  <input type="number" step="0.01" class="form-control" formControlName="total_wages"
                    placeholder="Enter wages amount"
                    [ngClass]="{'is-invalid': form.get('total_wages')?.touched && form.get('total_wages')?.invalid}">
                  <div class="invalid-feedback">Wages amount is required</div>
                  <small class="text-muted" *ngIf="selectedEmployeeIds.length > 0 && form.get('total_wages')?.value">
                    Per employee: &#8377;{{ getPerEmployeeWage(form.get('total_wages')?.value || 0, selectedEmployeeIds.length) | number:'1.2-2' }}
                  </small>
                </div>
                <div class="mb-3">
                  <label class="form-label">Remarks</label>
                  <textarea class="form-control" formControlName="remarks" rows="2"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="button" class="btn btn-brick" (click)="save()" [disabled]="form.invalid">
                <i class="fas fa-save me-1"></i> {{ editingItem ? 'Update' : 'Save' }}
              </button>
            </div>
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
              <h5 class="modal-title">Confirm Delete</h5>
              <button type="button" class="btn-close" (click)="showDeleteConfirm = false"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete this manufacture record?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDeleteConfirm = false">Cancel</button>
              <button type="button" class="btn btn-danger" (click)="deleteItem()">
                <i class="fas fa-trash me-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class KilnManufactureComponent implements OnInit {
  manufactures: any[] = [];
  kilnLoadings: any[] = [];
  employees: any[] = [];
  selectedEmployeeIds: string[] = [];
  showModal = false;
  showDeleteConfirm = false;
  editingItem: any = null;
  deletingItem: any = null;
  alertMessage = '';
  alertType = 'success';

  form = new FormGroup({
    kiln_loading_id: new FormControl('', Validators.required),
    quality_grade: new FormControl('', Validators.required),
    total_wages: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    manufacture_date: new FormControl('', Validators.required),
    remarks: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadKilnLoadings();
    this.loadEmployees();
  }

  loadData(): void {
    this.apiService.getKilnManufactures().subscribe({
      next: (data) => this.manufactures = data,
      error: () => this.showAlertMsg('Failed to load manufactures', 'danger')
    });
  }

  loadKilnLoadings(): void {
    this.apiService.getKilnLoadings().subscribe({
      next: (data) => this.kilnLoadings = data,
      error: () => {}
    });
  }

  loadEmployees(): void {
    this.apiService.getEmployees().subscribe({
      next: (data) => this.employees = data,
      error: () => {}
    });
  }

  // Get the latest kiln loading for a kiln number
  getKilnLoading(kilnNum: number): any {
    const matches = this.kilnLoadings.filter(kl => kl.kiln_number === String(kilnNum));
    return matches.length > 0 ? matches[0] : null; // sorted by createdAt desc from API
  }

  getKilnStatus(kilnNum: number): string {
    const kl = this.getKilnLoading(kilnNum);
    return kl ? kl.status : 'empty';
  }

  getKilnIconColor(kilnNum: number): string {
    const status = this.getKilnStatus(kilnNum);
    const colors: any = { empty: '#ccc', loading: '#f39c12', firing: '#e74c3c', ready: '#27ae60' };
    return colors[status] || '#ccc';
  }

  getKilnCardClass(kilnNum: number): string {
    const status = this.getKilnStatus(kilnNum);
    return status === 'firing' ? 'kiln-firing' : '';
  }

  updateStatus(id: string, status: string): void {
    this.apiService.updateKilnStatus(id, status).subscribe({
      next: () => {
        this.showAlertMsg('Kiln status updated to ' + status, 'success');
        this.loadKilnLoadings();
      },
      error: () => this.showAlertMsg('Failed to update status', 'danger')
    });
  }

  getKilnNumber(kilnLoading: any): string {
    if (!kilnLoading) return 'N/A';
    if (typeof kilnLoading === 'object') return kilnLoading.kiln_number || 'N/A';
    const kl = this.kilnLoadings.find(k => k._id === kilnLoading);
    return kl ? kl.kiln_number : 'N/A';
  }

  getBricksLoaded(kilnLoading: any): number {
    if (!kilnLoading) return 0;
    if (typeof kilnLoading === 'object') return kilnLoading.quantity_loaded || 0;
    const kl = this.kilnLoadings.find(k => k._id === kilnLoading);
    return kl ? kl.quantity_loaded : 0;
  }

  getEmployeeIds(item: any): string[] {
    if (item.employees && Array.isArray(item.employees)) {
      return item.employees.map((e: any) => typeof e === 'object' ? e._id : e);
    }
    return [];
  }

  isEmployeeSelected(id: string): boolean {
    return this.selectedEmployeeIds.includes(id);
  }

  trackByEmployeeId(index: number, emp: any): string {
    return emp._id;
  }

  getPerEmployeeWage(totalWages: number, employeeCount: number): number {
    return employeeCount > 0 ? totalWages / employeeCount : 0;
  }

  calculateWages(quantity: number): number {
    return (quantity || 0) * 1.1;
  }

  toggleEmployee(id: string): void {
    const idx = this.selectedEmployeeIds.indexOf(id);
    if (idx > -1) {
      this.selectedEmployeeIds.splice(idx, 1);
    } else {
      this.selectedEmployeeIds.push(id);
    }
  }

  openModal(item?: any): void {
    this.editingItem = item || null;
    if (item) {
      const kilnLoadingId = item.kiln_loading_id && typeof item.kiln_loading_id === 'object'
        ? item.kiln_loading_id._id : item.kiln_loading_id;
      this.form.patchValue({
        kiln_loading_id: kilnLoadingId?.toString() || '',
        quality_grade: item.quality_grade || '',
        total_wages: item.total_wages || 0,
        manufacture_date: item.manufacture_date ? item.manufacture_date.substring(0, 10) : '',
        remarks: item.remarks || ''
      });
      this.selectedEmployeeIds = [...this.getEmployeeIds(item)];
    } else {
      this.form.reset();
      this.selectedEmployeeIds = [];
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.form.reset();
    this.selectedEmployeeIds = [];
  }

  save(): void {
    if (this.form.invalid) return;
    const data = {
      ...this.form.value,
      quantity_manufactured: 0,
      employees: this.selectedEmployeeIds
    };

    if (this.editingItem) {
      this.apiService.updateKilnManufacture(this.editingItem._id, data).subscribe({
        next: () => {
          this.showAlertMsg('Manufacture record updated', 'success');
          this.closeModal();
          this.loadData();
        },
        error: () => this.showAlertMsg('Failed to update', 'danger')
      });
    } else {
      this.apiService.createKilnManufacture(data).subscribe({
        next: () => {
          this.showAlertMsg('Manufacture record created', 'success');
          this.closeModal();
          this.loadData();
        },
        error: () => this.showAlertMsg('Failed to create', 'danger')
      });
    }
  }

  confirmDelete(item: any): void {
    this.deletingItem = item;
    this.showDeleteConfirm = true;
  }

  deleteItem(): void {
    if (!this.deletingItem) return;
    this.apiService.deleteKilnManufacture(this.deletingItem._id).subscribe({
      next: () => {
        this.showAlertMsg('Manufacture record deleted', 'success');
        this.showDeleteConfirm = false;
        this.deletingItem = null;
        this.loadData();
      },
      error: () => {
        this.showAlertMsg('Failed to delete', 'danger');
        this.showDeleteConfirm = false;
      }
    });
  }

  archiveKiln(kl: any): void {
    const remaining = (kl.quantity_loaded || 0) - (kl.quantity_sold || 0);
    let msg = `Archive Kiln ${kl.kiln_number}?\n\nThis will save all data (loading, manufactures, sales) to Old Records and clear this kiln.`;
    if (remaining > 0) {
      msg += `\n\n${remaining.toLocaleString()} bricks remaining will be counted as damaged.`;
    }
    if (!confirm(msg)) return;

    this.apiService.createArchive({ kiln_loading_id: kl._id }).subscribe({
      next: () => {
        this.showAlertMsg('Kiln ' + kl.kiln_number + ' archived to Old Records', 'success');
        this.loadKilnLoadings();
        this.loadData();
      },
      error: (err) => {
        this.showAlertMsg(err.error?.error || 'Failed to archive', 'danger');
      }
    });
  }

  downloadPDF(): void {
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '-';
    const getEmpNames = (item: any) => {
      const ids = this.getEmployeeIds(item);
      return ids.map(id => { const e = this.employees.find(emp => emp._id === id); return e ? e.name : ''; }).filter(n => n).join(', ') || '-';
    };
    let html = `<html><head><title>Kiln Manufacturing Report</title><style>
      body{font-family:Arial,sans-serif;padding:20px;} h1{color:#c0392b;font-size:1.5rem;}
      table{width:100%;border-collapse:collapse;margin-top:15px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:0.85rem;}
      th{background:#c0392b;color:#fff;} tr:nth-child(even){background:#f9f9f9;}
      .header{display:flex;justify-content:space-between;align-items:center;} .date{color:#666;font-size:0.85rem;}
    </style></head><body>
    <div class="header"><h1>Kiln Manufacturing Report</h1><span class="date">Generated: ${new Date().toLocaleDateString('en-IN')}</span></div>
    <table><tr><th>#</th><th>Kiln</th><th>Work Type</th><th>Employees</th><th>Date</th><th>Wages</th></tr>`;
    this.manufactures.forEach((item, i) => {
      html += `<tr><td>${i+1}</td><td>Kiln ${this.getKilnNumber(item.kiln_loading_id)}</td><td>${item.quality_grade}</td>
        <td>${getEmpNames(item)}</td><td>${formatDate(item.manufacture_date)}</td><td>Rs.${(item.total_wages||0).toFixed(2)}</td></tr>`;
    });
    html += `</table></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  showAlertMsg(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 3000);
  }
}
