import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <!-- Alert -->
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-user-tie me-2"></i>Customers</h2>
      <button class="btn btn-brick" (click)="openModal()">
        <i class="fas fa-plus me-1"></i> Add New
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="table table-striped table-hover" *ngIf="customers.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Total Bricks Bought</th>
            <th>Total Amount (&#8377;)</th>
            <th>Total Paid (&#8377;)</th>
            <th>Balance (&#8377;)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of customers; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ item.name }}</strong></td>
            <td>
              <a *ngIf="item.phone" [href]="'tel:' + item.phone" style="color: #0d6efd; text-decoration: none;">
                <i class="fas fa-phone me-1"></i>{{ item.phone }}
              </a>
              <span *ngIf="!item.phone">-</span>
            </td>
            <td>{{ item.address || '-' }}</td>
            <td>{{ (item.total_bricks_bought || 0) | number:'1.0-0' }}</td>
            <td>{{ (item.total_amount || 0) | number:'1.2-2' }}</td>
            <td>{{ (item.total_paid || 0) | number:'1.2-2' }}</td>
            <td [ngStyle]="{'color': (item.balance || 0) > 0 ? '#dc3545' : '#198754'}">
              <strong>{{ (item.balance || 0) | number:'1.2-2' }}</strong>
            </td>
            <td>
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
      <div *ngIf="customers.length === 0" class="empty-state">
        <i class="fas fa-user-tie d-block"></i>
        <p>No customer records found</p>
        <button class="btn btn-brick btn-sm" (click)="openModal()">Add First Customer</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div *ngIf="showModal">
      <div class="modal-backdrop-custom" (click)="closeModal()"></div>
      <div class="modal-custom">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingItem ? 'Edit' : 'Add' }} Customer</h5>
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
              <h5 class="modal-title">Receive Payment</h5>
              <button type="button" class="btn-close" (click)="showPayModal = false"></button>
            </div>
            <div class="modal-body" *ngIf="payingCustomer">
              <div class="mb-3">
                <strong>Customer:</strong> {{ payingCustomer.name }}
              </div>
              <div class="mb-3">
                <strong>Total Amount:</strong> &#8377;{{ (payingCustomer.total_amount || 0) | number:'1.2-2' }}
              </div>
              <div class="mb-3">
                <strong>Total Paid:</strong> &#8377;{{ (payingCustomer.total_paid || 0) | number:'1.2-2' }}
              </div>
              <div class="mb-3">
                <strong>Current Balance:</strong>
                <span [ngStyle]="{'color': (payingCustomer.balance || 0) > 0 ? '#dc3545' : '#198754'}">
                  &#8377;{{ (payingCustomer.balance || 0) | number:'1.2-2' }}
                </span>
              </div>
              <hr>
              <div class="mb-3">
                <label class="form-label">Payment Amount *</label>
                <input type="number" class="form-control" [(ngModel)]="payAmount" min="0" step="0.01"
                  placeholder="Enter amount received">
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
              <p>Are you sure you want to delete customer <strong>{{ deletingItem?.name }}</strong>?</p>
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
export class CustomerComponent implements OnInit {
  customers: any[] = [];
  showModal = false;
  showDeleteConfirm = false;
  showPayModal = false;
  editingItem: any = null;
  deletingItem: any = null;
  payingCustomer: any = null;
  payAmount: number = 0;
  alertMessage = '';
  alertType = 'success';

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    phone: new FormControl(''),
    address: new FormControl(''),
    remarks: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getCustomers().subscribe({
      next: (data) => this.customers = data,
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to load customers', 'danger');
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
        remarks: item.remarks || ''
      });
    } else {
      this.form.reset();
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
      this.apiService.updateCustomer(this.editingItem._id, data).subscribe({
        next: () => {
          this.showAlert('Customer updated successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to update customer', 'danger');
        }
      });
    } else {
      this.apiService.createCustomer(data).subscribe({
        next: () => {
          this.showAlert('Customer created successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to create customer', 'danger');
        }
      });
    }
  }

  openPayModal(item: any): void {
    this.payingCustomer = item;
    this.payAmount = 0;
    this.showPayModal = true;
  }

  processPayment(): void {
    if (!this.payingCustomer || this.payAmount <= 0) return;
    this.apiService.payCustomer(this.payingCustomer._id, this.payAmount).subscribe({
      next: () => {
        this.showAlert('Payment recorded successfully', 'success');
        this.showPayModal = false;
        this.payingCustomer = null;
        this.payAmount = 0;
        this.loadData();
      },
      error: (err) => {
        console.error('Error:', err);
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
    this.apiService.deleteCustomer(this.deletingItem._id).subscribe({
      next: () => {
        this.showAlert('Customer deleted successfully', 'success');
        this.showDeleteConfirm = false;
        this.deletingItem = null;
        this.loadData();
      },
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to delete customer', 'danger');
        this.showDeleteConfirm = false;
      }
    });
  }

  showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 3000);
  }
}
