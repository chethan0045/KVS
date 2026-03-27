import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <!-- Alert -->
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-users me-2"></i>Employees</h2>
      <div>
        <button class="btn btn-outline-danger me-2" (click)="downloadPDF()" *ngIf="employees.length > 0">
          <i class="fas fa-file-pdf me-1"></i> PDF
        </button>
        <button class="btn btn-brick" (click)="openModal()">
          <i class="fas fa-plus me-1"></i> Add New
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="table table-striped table-hover" *ngIf="employees.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Total Earned (&#8377;)</th>
            <th>Total Paid (&#8377;)</th>
            <th>Balance (&#8377;)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of employees; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ item.name }}</strong></td>
            <td>{{ item.phone || '-' }}</td>
            <td>{{ (item.total_wages_earned || 0) | number:'1.2-2' }}</td>
            <td>{{ (item.total_paid || 0) | number:'1.2-2' }}</td>
            <td [ngStyle]="{'color': (item.balance || 0) > 0 ? '#198754' : (item.balance || 0) < 0 ? '#dc3545' : '#333'}">
              <strong>{{ (item.balance || 0) | number:'1.2-2' }}</strong>
            </td>
            <td style="white-space: nowrap;">
              <button class="btn btn-success btn-sm me-1" (click)="openPayModal(item)" title="Pay">
                <i class="fas fa-rupee-sign"></i>
              </button>
              <button class="btn btn-warning btn-sm me-1" (click)="openModal(item)" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm" (click)="confirmDelete(item)" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="employees.length === 0" class="empty-state">
        <i class="fas fa-users d-block"></i>
        <p>No employee records found</p>
        <button class="btn btn-brick btn-sm" (click)="openModal()">Add First Employee</button>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal">
      <div class="modal-backdrop-custom" (click)="closeModal()"></div>
      <div class="modal-custom">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingItem ? 'Edit' : 'Add' }} Employee</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="form">
                <div class="mb-3">
                  <label class="form-label">Name *</label>
                  <input type="text" class="form-control" formControlName="name"
                    [ngClass]="{'is-invalid': form.get('name')?.touched && form.get('name')?.invalid}">
                  <div class="invalid-feedback">Name is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Phone</label>
                  <input type="text" class="form-control" formControlName="phone">
                </div>
                <div class="mb-3">
                  <label class="form-label">Address</label>
                  <textarea class="form-control" formControlName="address" rows="2"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Joining Date *</label>
                  <input type="date" class="form-control" formControlName="joining_date"
                    [ngClass]="{'is-invalid': form.get('joining_date')?.touched && form.get('joining_date')?.invalid}">
                  <div class="invalid-feedback">Joining date is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Status *</label>
                  <select class="form-select" formControlName="status"
                    [ngClass]="{'is-invalid': form.get('status')?.touched && form.get('status')?.invalid}">
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div class="invalid-feedback">Status is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Old Balance (Loan)</label>
                  <input type="number" step="0.01" class="form-control" formControlName="old_balance"
                    placeholder="e.g. 5000 if employee took loan">
                  <small class="text-muted">Positive = employee owes you, Negative = you owe employee</small>
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

    <!-- Pay Modal -->
    <div *ngIf="showPayModal">
      <div class="modal-backdrop-custom" (click)="showPayModal = false"></div>
      <div class="modal-custom">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header pay-header">
              <h5 class="modal-title">Pay Employee</h5>
              <button type="button" class="btn-close" (click)="showPayModal = false"></button>
            </div>
            <div class="modal-body" *ngIf="payingEmployee">
              <div class="mb-3">
                <strong>Employee:</strong> {{ payingEmployee.name }}
              </div>
              <div class="mb-3">
                <strong>Total Earned:</strong> &#8377;{{ (payingEmployee.total_wages_earned || 0) | number:'1.2-2' }}
              </div>
              <div class="mb-3">
                <strong>Total Paid:</strong> &#8377;{{ (payingEmployee.total_paid || 0) | number:'1.2-2' }}
              </div>
              <div class="mb-3">
                <strong>Current Balance:</strong>
                <span [ngStyle]="{'color': (payingEmployee.balance || 0) > 0 ? '#198754' : (payingEmployee.balance || 0) < 0 ? '#dc3545' : '#333'}">
                  &#8377;{{ (payingEmployee.balance || 0) | number:'1.2-2' }}
                </span>
              </div>
              <hr>
              <div class="mb-3">
                <label class="form-label">Payment Amount *</label>
                <input type="number" class="form-control" [(ngModel)]="payAmount" min="0" step="0.01"
                  placeholder="Enter amount to pay">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showPayModal = false">Cancel</button>
              <button type="button" class="btn btn-success" (click)="processPayment()" [disabled]="!payAmount || payAmount <= 0">
                <i class="fas fa-rupee-sign me-1"></i> Pay
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
              <p>Are you sure you want to delete employee <strong>{{ deletingItem?.name }}</strong>?</p>
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
export class EmployeeComponent implements OnInit {
  employees: any[] = [];
  showModal = false;
  showDeleteConfirm = false;
  showPayModal = false;
  editingItem: any = null;
  deletingItem: any = null;
  payingEmployee: any = null;
  payAmount: number = 0;
  alertMessage = '';
  alertType = 'success';

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    phone: new FormControl(''),
    address: new FormControl(''),
    joining_date: new FormControl('', Validators.required),
    status: new FormControl('', Validators.required),
    old_balance: new FormControl<number>(0),
    remarks: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getEmployees().subscribe({
      next: (data) => this.employees = data,
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to load employees', 'danger');
      }
    });
  }

  openModal(item?: any): void {
    this.editingItem = item || null;
    if (item) {
      this.form.patchValue({
        name: item.name,
        phone: item.phone || '',
        address: item.address || '',
        joining_date: item.joining_date ? item.joining_date.substring(0, 10) : '',
        status: item.status,
        old_balance: item.old_balance || 0,
        remarks: item.remarks || ''
      });
    } else {
      this.form.reset();
      this.form.patchValue({ status: 'active' });
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
    const data = this.form.value;

    if (this.editingItem) {
      this.apiService.updateEmployee(this.editingItem._id, data).subscribe({
        next: () => {
          this.showAlert('Employee updated successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to update employee', 'danger');
        }
      });
    } else {
      this.apiService.createEmployee(data).subscribe({
        next: () => {
          this.showAlert('Employee created successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to create employee', 'danger');
        }
      });
    }
  }

  openPayModal(item: any): void {
    this.payingEmployee = item;
    this.payAmount = 0;
    this.showPayModal = true;
  }

  processPayment(): void {
    if (!this.payingEmployee || this.payAmount <= 0) return;
    this.apiService.payEmployee(this.payingEmployee._id, this.payAmount).subscribe({
      next: () => {
        this.showAlert('Payment recorded successfully', 'success');
        this.showPayModal = false;
        this.payingEmployee = null;
        this.payAmount = 0;
        this.loadData();
      },
      error: (err) => {
        this.showAlert('Failed to process payment', 'danger');
      }
    });
  }

  confirmDelete(item: any): void {
    this.deletingItem = item;
    this.showDeleteConfirm = true;
  }

  deleteItem(): void {
    if (!this.deletingItem) return;
    this.apiService.deleteEmployee(this.deletingItem._id).subscribe({
      next: () => {
        this.showAlert('Employee deleted successfully', 'success');
        this.showDeleteConfirm = false;
        this.deletingItem = null;
        this.loadData();
      },
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to delete employee', 'danger');
        this.showDeleteConfirm = false;
      }
    });
  }

  downloadPDF(): void {
    let html = `<html><head><title>Employees Report</title><style>
      body{font-family:Arial,sans-serif;padding:20px;} h1{color:#c0392b;font-size:1.5rem;}
      table{width:100%;border-collapse:collapse;margin-top:15px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:0.85rem;}
      th{background:#c0392b;color:#fff;} tr:nth-child(even){background:#f9f9f9;}
      .header{display:flex;justify-content:space-between;align-items:center;} .date{color:#666;font-size:0.85rem;}
      .green{color:#198754;} .red{color:#dc3545;}
    </style></head><body>
    <div class="header"><h1>Employees Report</h1><span class="date">Generated: ${new Date().toLocaleDateString('en-IN')}</span></div>
    <table><tr><th>#</th><th>Name</th><th>Phone</th><th>Total Earned</th><th>Total Paid</th><th>Balance</th></tr>`;
    this.employees.forEach((item, i) => {
      const bal = item.balance || 0;
      const balColor = bal > 0 ? 'green' : bal < 0 ? 'red' : '';
      html += `<tr><td>${i+1}</td><td>${item.name}</td><td>${item.phone||'-'}</td>
        <td>Rs.${(item.total_wages_earned||0).toFixed(2)}</td><td>Rs.${(item.total_paid||0).toFixed(2)}</td>
        <td class="${balColor}"><strong>Rs.${bal.toFixed(2)}</strong></td></tr>`;
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
