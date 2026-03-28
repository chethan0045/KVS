import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <!-- Alert -->
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-industry me-2"></i>Brick Production</h2>
      <div>
        <button class="btn btn-outline-danger me-2" (click)="downloadPDF()" *ngIf="productions.length > 0">
          <i class="fas fa-file-pdf me-1"></i> PDF
        </button>
        <button class="btn btn-brick" (click)="openModal()">
          <i class="fas fa-plus me-1"></i> Add New
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="table table-striped table-hover" *ngIf="productions.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Quantity</th>
            <th>Sections</th>
            <th>Employee</th>
            <th>Wages (&#8377;)</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of productions; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ item.quantity | number }}</strong></td>
            <td>
              <small *ngIf="item.sections?.length > 0">
                <span *ngFor="let s of item.sections; let last = last">
                  {{ s.section_no }}{{ !last ? ', ' : '' }}
                </span>
              </small>
              <span *ngIf="!item.sections?.length">-</span>
            </td>
            <td>{{ getEmployeeName(item.employee_id) }}</td>
            <td><strong>&#8377;{{ (item.quantity * 1.1) | number:'1.2-2' }}</strong></td>
            <td>{{ item.production_date | date:'mediumDate' }}</td>
            <td>
              <span class="badge badge-status"
                [ngClass]="{
                  'bg-success': item.status === 'ready_for_kiln',
                  'bg-info': item.status === 'produced'
                }">
                {{ item.status === 'ready_for_kiln' ? 'Ready for Kiln' : 'Produced' }}
              </span>
            </td>
            <td style="white-space: nowrap;">
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
      <div *ngIf="productions.length === 0" class="empty-state">
        <i class="fas fa-box-open d-block"></i>
        <p>No production records found</p>
        <button class="btn btn-brick btn-sm" (click)="openModal()">Add First Record</button>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal">
      <div class="modal-backdrop-custom" (click)="closeModal()"></div>
      <div class="modal-custom">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingItem ? 'Edit' : 'Add' }} Production</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="form">
                <!-- Sections Table -->
                <div class="mb-3">
                  <label class="form-label">Sections / Kana *</label>
                  <div *ngFor="let section of sections; let sIdx = index"
                    class="mb-3 p-2" style="background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
                    <div class="d-flex align-items-center mb-2 gap-2">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="section.section_no"
                        [ngModelOptions]="{standalone: true}" placeholder="Section/Kana No." style="max-width: 150px; font-weight: bold;">
                      <span class="text-muted" style="font-size:0.8rem; flex:1;">= {{ getSectionTotal(sIdx) | number }} bricks</span>
                      <button class="btn btn-outline-danger btn-sm" (click)="removeSection(sIdx)" *ngIf="sections.length > 1" title="Remove section">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    <div *ngFor="let entry of section.entries; let eIdx = index" class="d-flex align-items-center mb-1 gap-1">
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="entry.a"
                        [ngModelOptions]="{standalone: true}" placeholder="0" (input)="calcTotal()" style="flex:1; text-align:center;">
                      <span style="font-weight:bold; color:#888;">×</span>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="entry.b"
                        [ngModelOptions]="{standalone: true}" placeholder="0" (input)="calcTotal()" style="flex:1; text-align:center;">
                      <span class="text-muted" style="min-width:55px; font-size:0.8rem;">= {{ (entry.a || 0) * (entry.b || 0) | number }}</span>
                      <button class="btn btn-outline-danger btn-sm" style="padding:2px 6px;" (click)="removeEntry(sIdx, eIdx)"
                        *ngIf="section.entries.length > 1" title="Remove">
                        <i class="fas fa-minus" style="font-size:0.7rem;"></i>
                      </button>
                    </div>
                    <button type="button" class="btn btn-outline-secondary btn-sm mt-1" (click)="addEntry(sIdx)">
                      <i class="fas fa-plus me-1"></i> Add Row
                    </button>
                  </div>
                  <button type="button" class="btn btn-outline-primary btn-sm" (click)="addSection()">
                    <i class="fas fa-plus me-1"></i> Add Section
                  </button>
                  <div class="mt-2 p-2" style="background:#e8f5e9; border-radius:6px; font-weight:bold; color:#2e7d32;">
                    Grand Total: {{ totalQty | number }} bricks
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Employee</label>
                  <select class="form-select" formControlName="employee_id">
                    <option value="">Select employee</option>
                    <option *ngFor="let emp of employees" [value]="emp._id">
                      {{ emp.name }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Production Date *</label>
                  <input type="date" class="form-control" formControlName="production_date"
                    [ngClass]="{'is-invalid': form.get('production_date')?.touched && form.get('production_date')?.invalid}">
                  <div class="invalid-feedback">Production date is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Status *</label>
                  <select class="form-select" formControlName="status"
                    [ngClass]="{'is-invalid': form.get('status')?.touched && form.get('status')?.invalid}">
                    <option value="">Select status</option>
                    <option value="produced">Produced</option>
                    <option value="ready_for_kiln">Ready for Kiln</option>
                  </select>
                  <div class="invalid-feedback">Status is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Wages</label>
                  <input type="text" class="form-control" readonly
                    style="background-color: #f8f9fa; font-weight: bold;"
                    [value]="'\\u20B9' + (totalQty * 1.1).toFixed(2)">
                  <small class="text-muted">{{ totalQty | number }} x &#8377;1.10</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">Remarks</label>
                  <textarea class="form-control" formControlName="remarks" rows="2"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="button" class="btn btn-brick" (click)="save()" [disabled]="form.invalid || totalQty <= 0">
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
              <p>Are you sure you want to delete this production record?</p>
              <p class="text-muted mb-0">This action cannot be undone.</p>
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
export class ProductionComponent implements OnInit {
  productions: any[] = [];
  employees: any[] = [];
  showModal = false;
  showDeleteConfirm = false;
  editingItem: any = null;
  deletingItem: any = null;
  alertMessage = '';
  alertType = 'success';
  sections: { section_no: string; entries: { a: number | null; b: number | null }[] }[] = [];
  totalQty = 0;

  form = new FormGroup({
    employee_id: new FormControl(''),
    production_date: new FormControl('', Validators.required),
    status: new FormControl('', Validators.required),
    remarks: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadEmployees();
  }

  loadData(): void {
    this.apiService.getProductions().subscribe({
      next: (data) => this.productions = data,
      error: () => this.showAlert('Failed to load productions', 'danger')
    });
  }

  loadEmployees(): void {
    this.apiService.getEmployees().subscribe({
      next: (data) => this.employees = data,
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  getSectionTotal(sIdx: number): number {
    return this.sections[sIdx].entries.reduce((sum, e) => sum + (e.a || 0) * (e.b || 0), 0);
  }

  calcTotal(): void {
    this.totalQty = this.sections.reduce((sum, s) =>
      sum + s.entries.reduce((eSum, e) => eSum + (e.a || 0) * (e.b || 0), 0), 0);
  }

  addSection(): void {
    this.sections.push({ section_no: '', entries: [{ a: null, b: null }] });
  }

  removeSection(idx: number): void {
    this.sections.splice(idx, 1);
    this.calcTotal();
  }

  addEntry(sIdx: number): void {
    this.sections[sIdx].entries.push({ a: null, b: null });
  }

  removeEntry(sIdx: number, eIdx: number): void {
    this.sections[sIdx].entries.splice(eIdx, 1);
    this.calcTotal();
  }

  getEmployeeName(employeeId: any): string {
    if (!employeeId) return '-';
    if (typeof employeeId === 'object' && employeeId.name) return employeeId.name;
    const id = typeof employeeId === 'object' ? employeeId._id : employeeId;
    const emp = this.employees.find(e => e._id === id);
    return emp ? emp.name : 'N/A';
  }

  openModal(item?: any): void {
    this.editingItem = item || null;
    if (item) {
      this.form.patchValue({
        employee_id: item.employee_id ? (typeof item.employee_id === 'object' ? item.employee_id._id : item.employee_id) : '',
        production_date: item.production_date ? item.production_date.substring(0, 10) : '',
        status: item.status,
        remarks: item.remarks || ''
      });
      if (item.sections && item.sections.length > 0) {
        this.sections = item.sections.map((s: any) => ({
          section_no: s.section_no || '',
          entries: s.entries && s.entries.length > 0
            ? s.entries.map((e: any) => ({ a: e.a || e.value || null, b: e.b || 1 }))
            : [{ a: null, b: null }]
        }));
      } else {
        this.sections = [{ section_no: '', entries: [{ a: item.quantity, b: 1 }] }];
      }
      this.calcTotal();
    } else {
      this.form.reset();
      this.form.patchValue({ status: 'produced' });
      this.sections = [{ section_no: '', entries: [{ a: null, b: null }] }];
      this.totalQty = 0;
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.form.reset();
    this.sections = [{ section_no: '', entries: [{ a: null, b: null }] }];
    this.totalQty = 0;
  }

  save(): void {
    if (this.form.invalid || this.totalQty <= 0) return;
    const sectionsData = this.sections.map(s => ({
      section_no: s.section_no,
      entries: s.entries.map(e => ({ a: e.a || 0, b: e.b || 0, value: (e.a || 0) * (e.b || 0) }))
    }));

    const data = {
      ...this.form.value,
      quantity: this.totalQty,
      sections: sectionsData,
      employee_id: this.form.value.employee_id || null
    };

    if (this.editingItem) {
      this.apiService.updateProduction(this.editingItem._id, data).subscribe({
        next: () => { this.showAlert('Production updated', 'success'); this.closeModal(); this.loadData(); },
        error: (err) => this.showAlert(err.error?.error || 'Failed to update', 'danger')
      });
    } else {
      this.apiService.createProduction(data).subscribe({
        next: () => { this.showAlert('Production created', 'success'); this.closeModal(); this.loadData(); },
        error: (err) => this.showAlert(err.error?.error || 'Failed to create', 'danger')
      });
    }
  }

  confirmDelete(item: any): void {
    this.deletingItem = item;
    this.showDeleteConfirm = true;
  }

  deleteItem(): void {
    if (!this.deletingItem) return;
    this.apiService.deleteProduction(this.deletingItem._id).subscribe({
      next: () => { this.showAlert('Deleted', 'success'); this.showDeleteConfirm = false; this.deletingItem = null; this.loadData(); },
      error: () => { this.showAlert('Failed to delete', 'danger'); this.showDeleteConfirm = false; }
    });
  }

  downloadPDF(): void {
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '-';
    let html = `<html><head><title>Brick Production Report</title><style>
      body{font-family:Arial,sans-serif;padding:20px;} h1{color:#c0392b;font-size:1.5rem;}
      table{width:100%;border-collapse:collapse;margin-top:15px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:0.85rem;}
      th{background:#c0392b;color:#fff;} tr:nth-child(even){background:#f9f9f9;}
      .header{display:flex;justify-content:space-between;align-items:center;} .date{color:#666;font-size:0.85rem;}
    </style></head><body>
    <div class="header"><h1>Brick Production Report</h1><span class="date">Generated: ${new Date().toLocaleDateString('en-IN')}</span></div>
    <table><tr><th>#</th><th>Sections</th><th>Quantity</th><th>Employee</th><th>Wages</th><th>Date</th><th>Status</th></tr>`;
    this.productions.forEach((item, i) => {
      const secs = item.sections?.map((s: any) => s.section_no).filter((n: string) => n).join(', ') || '-';
      html += `<tr><td>${i+1}</td><td>${secs}</td><td>${(item.quantity||0).toLocaleString()}</td>
        <td>${this.getEmployeeName(item.employee_id)}</td><td>Rs.${(item.quantity*1.1).toFixed(2)}</td>
        <td>${formatDate(item.production_date)}</td><td>${item.status === 'ready_for_kiln' ? 'Ready for Kiln' : 'Produced'}</td></tr>`;
    });
    html += `</table></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 3000);
  }
}
