import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-husk-load',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-seedling me-2"></i>Husk Loads</h2>
      <button class="btn btn-brick" (click)="openModal()">
        <i class="fas fa-plus me-1"></i> Add New
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="row g-4 mb-4">
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total Husk Cost</div>
                <div class="card-value" style="color: #8B4513;">&#8377;{{ totalCost | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon bg-brick-brown"><i class="fas fa-seedling"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Total Paid</div>
                <div class="card-value" style="color: #27ae60;">&#8377;{{ totalPaid | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #27ae60;"><i class="fas fa-check"></i></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="card stats-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="card-label mb-1">Balance Due</div>
                <div class="card-value" style="color: #dc3545;">&#8377;{{ totalBalance | number:'1.2-2' }}</div>
              </div>
              <div class="card-icon" style="background-color: #dc3545;"><i class="fas fa-exclamation-circle"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="table table-striped table-hover" *ngIf="huskLoads.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Supplier</th>
            <th>Tonnage</th>
            <th>Price/Ton</th>
            <th>Total Amount</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Received Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of huskLoads; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ item.supplier_name || '-' }}</strong></td>
            <td>{{ item.tonnage | number:'1.2-2' }} T</td>
            <td>&#8377;{{ item.price_per_ton | number:'1.2-2' }}</td>
            <td><strong>&#8377;{{ item.total_amount | number:'1.2-2' }}</strong></td>
            <td style="color: #27ae60;">&#8377;{{ (item.total_paid || 0) | number:'1.2-2' }}</td>
            <td [ngStyle]="{'color': (item.balance || 0) > 0 ? '#dc3545' : '#198754'}">
              <strong>&#8377;{{ (item.balance || 0) | number:'1.2-2' }}</strong>
            </td>
            <td>{{ item.received_date | date:'mediumDate' }}</td>
            <td>
              <button class="btn btn-success btn-sm me-1" (click)="openPayModal(item)" title="Pay">
                <i class="fas fa-rupee-sign"></i>
              </button>
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
      <div *ngIf="huskLoads.length === 0" class="empty-state">
        <i class="fas fa-seedling d-block"></i>
        <p>No husk load records found</p>
        <button class="btn btn-brick btn-sm" (click)="openModal()">Add First Record</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div *ngIf="showModal">
      <div class="modal-backdrop-custom" (click)="closeModal()"></div>
      <div class="modal-custom">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingItem ? 'Edit' : 'Add' }} Husk Load</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="form">
                <div class="mb-3">
                  <label class="form-label">Supplier Name</label>
                  <input type="text" class="form-control" formControlName="supplier_name" placeholder="Supplier name">
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Tonnage *</label>
                    <input type="number" step="0.01" class="form-control" formControlName="tonnage"
                      [ngClass]="{'is-invalid': form.get('tonnage')?.touched && form.get('tonnage')?.invalid}">
                    <div class="invalid-feedback">Tonnage is required</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Price per Ton *</label>
                    <input type="number" step="1" class="form-control" formControlName="price_per_ton"
                      [ngClass]="{'is-invalid': form.get('price_per_ton')?.touched && form.get('price_per_ton')?.invalid}">
                    <div class="invalid-feedback">Price per ton is required</div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Total Amount</label>
                  <input type="number" step="0.01" class="form-control" formControlName="total_amount" readonly
                    style="background-color: #f8f9fa; font-weight: bold;">
                  <small class="text-muted">Tonnage x Price per Ton</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">Amount Paid</label>
                  <input type="number" step="0.01" class="form-control" formControlName="total_paid" placeholder="0">
                </div>
                <div class="mb-3">
                  <label class="form-label">Received Date *</label>
                  <input type="date" class="form-control" formControlName="received_date"
                    [ngClass]="{'is-invalid': form.get('received_date')?.touched && form.get('received_date')?.invalid}">
                  <div class="invalid-feedback">Received date is required</div>
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
              <h5 class="modal-title">Pay Husk Load</h5>
              <button type="button" class="btn-close" (click)="showPayModal = false"></button>
            </div>
            <div class="modal-body" *ngIf="payingItem">
              <div class="mb-2"><strong>Supplier:</strong> {{ payingItem.supplier_name || '-' }}</div>
              <div class="mb-2"><strong>Total Amount:</strong> &#8377;{{ (payingItem.total_amount || 0) | number:'1.2-2' }}</div>
              <div class="mb-2"><strong>Total Paid:</strong> &#8377;{{ (payingItem.total_paid || 0) | number:'1.2-2' }}</div>
              <div class="mb-3">
                <strong>Balance:</strong>
                <span style="color: #dc3545;"> &#8377;{{ (payingItem.balance || 0) | number:'1.2-2' }}</span>
              </div>
              <hr>
              <div class="mb-3">
                <label class="form-label">Payment Amount *</label>
                <input type="number" class="form-control" [(ngModel)]="payAmount" min="0" step="0.01" placeholder="Enter amount">
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
              <p>Are you sure you want to delete this husk load record?</p>
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
export class HuskLoadComponent implements OnInit {
  huskLoads: any[] = [];
  totalCost = 0;
  totalPaid = 0;
  totalBalance = 0;
  showModal = false;
  showDeleteConfirm = false;
  showPayModal = false;
  editingItem: any = null;
  deletingItem: any = null;
  payingItem: any = null;
  payAmount = 0;
  alertMessage = '';
  alertType = 'success';

  form = new FormGroup({
    supplier_name: new FormControl(''),
    tonnage: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    price_per_ton: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    total_amount: new FormControl<number | null>({ value: null, disabled: false }),
    total_paid: new FormControl<number | null>(0),
    received_date: new FormControl('', Validators.required),
    remarks: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
    this.setupAutoCalc();
  }

  setupAutoCalc(): void {
    this.form.get('tonnage')?.valueChanges.subscribe(() => this.calcTotal());
    this.form.get('price_per_ton')?.valueChanges.subscribe(() => this.calcTotal());
  }

  calcTotal(): void {
    const t = this.form.get('tonnage')?.value || 0;
    const p = this.form.get('price_per_ton')?.value || 0;
    this.form.get('total_amount')?.setValue(Math.round(t * p * 100) / 100, { emitEvent: false });
  }

  loadData(): void {
    this.apiService.getHuskLoads().subscribe({
      next: (data) => {
        this.huskLoads = data;
        this.totalCost = data.reduce((s: number, h: any) => s + (h.total_amount || 0), 0);
        this.totalPaid = data.reduce((s: number, h: any) => s + (h.total_paid || 0), 0);
        this.totalBalance = data.reduce((s: number, h: any) => s + (h.balance || 0), 0);
      },
      error: () => this.showAlert('Failed to load husk loads', 'danger')
    });
  }

  openModal(item?: any): void {
    this.editingItem = item || null;
    if (item) {
      this.form.patchValue({
        supplier_name: item.supplier_name || '',
        tonnage: item.tonnage,
        price_per_ton: item.price_per_ton,
        total_amount: item.total_amount,
        total_paid: item.total_paid || 0,
        received_date: item.received_date ? item.received_date.substring(0, 10) : '',
        remarks: item.remarks || ''
      });
    } else {
      this.form.reset();
      this.form.patchValue({ total_paid: 0 });
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
    const data = this.form.getRawValue();

    if (this.editingItem) {
      this.apiService.updateHuskLoad(this.editingItem._id, data).subscribe({
        next: () => { this.showAlert('Updated successfully', 'success'); this.closeModal(); this.loadData(); },
        error: () => this.showAlert('Failed to update', 'danger')
      });
    } else {
      this.apiService.createHuskLoad(data).subscribe({
        next: () => { this.showAlert('Created successfully', 'success'); this.closeModal(); this.loadData(); },
        error: () => this.showAlert('Failed to create', 'danger')
      });
    }
  }

  openPayModal(item: any): void {
    this.payingItem = item;
    this.payAmount = 0;
    this.showPayModal = true;
  }

  processPayment(): void {
    if (!this.payingItem || this.payAmount <= 0) return;
    this.apiService.payHuskLoad(this.payingItem._id, this.payAmount).subscribe({
      next: () => {
        this.showAlert('Payment recorded', 'success');
        this.showPayModal = false;
        this.payingItem = null;
        this.payAmount = 0;
        this.loadData();
      },
      error: () => this.showAlert('Failed to process payment', 'danger')
    });
  }

  confirmDelete(item: any): void {
    this.deletingItem = item;
    this.showDeleteConfirm = true;
  }

  deleteItem(): void {
    if (!this.deletingItem) return;
    this.apiService.deleteHuskLoad(this.deletingItem._id).subscribe({
      next: () => {
        this.showAlert('Deleted successfully', 'success');
        this.showDeleteConfirm = false;
        this.deletingItem = null;
        this.loadData();
      },
      error: () => { this.showAlert('Failed to delete', 'danger'); this.showDeleteConfirm = false; }
    });
  }

  showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 3000);
  }
}
