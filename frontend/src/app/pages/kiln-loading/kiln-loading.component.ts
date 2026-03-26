import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-kiln-loading',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <!-- Alert -->
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-truck-loading me-2"></i>Kiln Loading</h2>
      <button class="btn btn-brick" (click)="openModal()">
        <i class="fas fa-plus me-1"></i> Add New
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="table table-striped table-hover" *ngIf="kilnLoadings.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Kiln Number</th>
            <th>Qty Loaded</th>
            <th>Employees</th>
            <th>Loading Date</th>
            <th>Wages (&#8377;)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of kilnLoadings; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>Kiln {{ item.kiln_number }}</strong></td>
            <td>{{ item.quantity_loaded | number }}</td>
            <td>
              <span class="badge bg-info" *ngIf="getEmployeeIds(item).length > 0">
                {{ getEmployeeIds(item).length }} employee{{ getEmployeeIds(item).length > 1 ? 's' : '' }}
              </span>
              <span *ngIf="getEmployeeIds(item).length === 0">-</span>
            </td>
            <td>{{ item.loading_date | date:'mediumDate' }}</td>
            <td>
              <strong>&#8377;{{ item.total_wages || calculateWages(item.quantity_loaded) | number:'1.2-2' }}</strong>
              <br *ngIf="getEmployeeIds(item).length > 0">
              <small *ngIf="getEmployeeIds(item).length > 0" class="text-muted">
                &#8377;{{ getPerEmployeeWage(item.total_wages || calculateWages(item.quantity_loaded), getEmployeeIds(item).length) | number:'1.2-2' }}/person
              </small>
            </td>
            <td>
              <span class="badge badge-status"
                [ngClass]="{
                  'bg-warning text-dark': item.status === 'loading',
                  'bg-danger': item.status === 'firing',
                  'bg-success': item.status === 'ready'
                }">
                {{ item.status | titlecase }}
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
      <div *ngIf="kilnLoadings.length === 0" class="empty-state">
        <i class="fas fa-fire d-block"></i>
        <p>No kiln loading records found</p>
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
              <h5 class="modal-title">{{ editingItem ? 'Edit' : 'Add' }} Kiln Loading</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
              <form [formGroup]="form">
                <div class="mb-3">
                  <label class="form-label">Kiln Number *</label>
                  <select class="form-select" formControlName="kiln_number"
                    [ngClass]="{'is-invalid': form.get('kiln_number')?.touched && form.get('kiln_number')?.invalid}">
                    <option value="">Select kiln</option>
                    <option value="1">Kiln 1</option>
                    <option value="2">Kiln 2</option>
                    <option value="3">Kiln 3</option>
                    <option value="4">Kiln 4</option>
                  </select>
                  <div class="invalid-feedback">Kiln number is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Quantity Loaded *</label>
                  <input type="number" class="form-control" formControlName="quantity_loaded"
                    [ngClass]="{'is-invalid': form.get('quantity_loaded')?.touched && form.get('quantity_loaded')?.invalid}">
                  <div class="invalid-feedback">Quantity is required and must be positive</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Employees</label>
                  <div style="max-height: 150px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 6px; padding: 8px;">
                    <div *ngFor="let emp of employees; trackBy: trackByEmployeeId" class="form-check">
                      <input class="form-check-input" type="checkbox"
                        [id]="'loading-emp-' + emp._id"
                        [checked]="isEmployeeSelected(emp._id)"
                        (change)="toggleEmployee(emp._id)">
                      <label class="form-check-label" [for]="'loading-emp-' + emp._id">
                        {{ emp.name }}
                      </label>
                    </div>
                    <div *ngIf="employees.length === 0" class="text-muted small">No employees found</div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Loading Date *</label>
                  <input type="date" class="form-control" formControlName="loading_date"
                    [ngClass]="{'is-invalid': form.get('loading_date')?.touched && form.get('loading_date')?.invalid}">
                  <div class="invalid-feedback">Loading date is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Total Wages</label>
                  <input type="text" class="form-control" readonly
                    style="background-color: #f8f9fa; font-weight: bold;"
                    [value]="'\\u20B9' + calculateWages(form.get('quantity_loaded')?.value || 0).toFixed(2)">
                  <small class="text-muted">
                    Quantity x &#8377;0.55
                    <span *ngIf="selectedEmployeeIds.length > 0">
                      | Per employee: &#8377;{{ getPerEmployeeWage(calculateWages(form.get('quantity_loaded')?.value || 0), selectedEmployeeIds.length).toFixed(2) }}
                    </span>
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
              <p>Are you sure you want to delete kiln loading <strong>{{ deletingItem?.kiln_number }}</strong>?</p>
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
export class KilnLoadingComponent implements OnInit {
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
    kiln_number: new FormControl('', Validators.required),
    quantity_loaded: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    loading_date: new FormControl('', Validators.required),
    remarks: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadEmployees();
  }

  loadData(): void {
    this.apiService.getKilnLoadings().subscribe({
      next: (data) => this.kilnLoadings = data,
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to load kiln loadings', 'danger');
      }
    });
  }

  loadEmployees(): void {
    this.apiService.getEmployees().subscribe({
      next: (data) => this.employees = data,
      error: (err) => console.error('Error loading employees:', err)
    });
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
    return (quantity || 0) * 0.55;
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
      this.form.patchValue({
        kiln_number: item.kiln_number,
        quantity_loaded: item.quantity_loaded,
        loading_date: item.loading_date ? item.loading_date.substring(0, 10) : '',
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
      status: this.editingItem ? this.editingItem.status : 'loading',
      employees: this.selectedEmployeeIds,
      total_wages: this.calculateWages(this.form.value.quantity_loaded || 0)
    };

    if (this.editingItem) {
      this.apiService.updateKilnLoading(this.editingItem._id, data).subscribe({
        next: () => {
          this.showAlert('Kiln loading updated successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to update kiln loading', 'danger');
        }
      });
    } else {
      this.apiService.createKilnLoading(data).subscribe({
        next: () => {
          this.showAlert('Kiln loading created successfully', 'success');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error:', err);
          this.showAlert('Failed to create kiln loading', 'danger');
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
    this.apiService.deleteKilnLoading(this.deletingItem._id).subscribe({
      next: () => {
        this.showAlert('Kiln loading deleted successfully', 'success');
        this.showDeleteConfirm = false;
        this.deletingItem = null;
        this.loadData();
      },
      error: (err) => {
        console.error('Error:', err);
        this.showAlert('Failed to delete kiln loading', 'danger');
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
