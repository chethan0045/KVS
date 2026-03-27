import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
            <th>Batch Number</th>
            <th>Quantity</th>
            <th>Employee</th>
            <th>Wages (&#8377;)</th>
            <th>Production Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of productions; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ item.batch_number }}</strong></td>
            <td>{{ item.quantity | number }}</td>
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
                <div class="mb-3">
                  <label class="form-label">Batch Number *</label>
                  <input type="text" class="form-control" formControlName="batch_number"
                    [ngClass]="{'is-invalid': form.get('batch_number')?.touched && form.get('batch_number')?.invalid}">
                  <div class="invalid-feedback">Batch number is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Quantity *</label>
                  <input type="number" class="form-control" formControlName="quantity"
                    [ngClass]="{'is-invalid': form.get('quantity')?.touched && form.get('quantity')?.invalid}">
                  <div class="invalid-feedback">Quantity is required and must be positive</div>
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
              <p>Are you sure you want to delete production batch <strong>{{ deletingItem?.batch_number }}</strong>?</p>
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

  form = new FormGroup({
    batch_number: new FormControl('', Validators.required),
    quantity: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
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
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to load productions', 'danger');
      }
    });
  }

  loadEmployees(): void {
    this.apiService.getEmployees().subscribe({
      next: (data) => this.employees = data,
      error: (err) => console.error('Error loading employees:', err)
    });
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
        batch_number: item.batch_number,
        quantity: item.quantity,
        employee_id: item.employee_id ? (typeof item.employee_id === 'object' ? item.employee_id._id : item.employee_id) : '',
        production_date: item.production_date ? item.production_date.substring(0, 10) : '',
        status: item.status,
        remarks: item.remarks || ''
      });
    } else {
      this.form.reset();
      this.form.patchValue({ status: 'produced' });
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;
    const formValue = this.form.value;
    const data = {
      batch_number: formValue.batch_number,
      quantity: formValue.quantity,
      employee_id: formValue.employee_id || null,
      production_date: formValue.production_date,
      status: formValue.status,
      remarks: formValue.remarks
    };

    if (this.editingItem) {
      this.apiService.updateProduction(this.editingItem._id, data).subscribe({
        next: () => {
          this.showAlert('Production updated successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to update production', 'danger');
        }
      });
    } else {
      this.apiService.createProduction(data).subscribe({
        next: () => {
          this.showAlert('Production created successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to create production', 'danger');
        }
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
      next: () => {
        this.showAlert('Production deleted successfully', 'success');
        this.showDeleteConfirm = false;
        this.deletingItem = null;
        this.loadData();
      },
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to delete production', 'danger');
        this.showDeleteConfirm = false;
      }
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
    <table><tr><th>#</th><th>Batch Number</th><th>Quantity</th><th>Employee</th><th>Wages</th><th>Date</th><th>Status</th></tr>`;
    this.productions.forEach((item, i) => {
      html += `<tr><td>${i+1}</td><td>${item.batch_number}</td><td>${(item.quantity||0).toLocaleString()}</td>
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
