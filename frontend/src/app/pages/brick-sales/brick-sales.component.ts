import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-brick-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <!-- Alert -->
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-shopping-cart me-2"></i>Brick Sales</h2>
      <button class="btn btn-brick" (click)="openModal()">
        <i class="fas fa-plus me-1"></i> Add New
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="table table-striped table-hover" *ngIf="sales.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Kiln</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Driver</th>
            <th>Helper</th>
            <th>Date</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of sales; let i = index">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ getCustomerName(item.customer_id) }}</strong></td>
            <td>{{ getKilnLabel(item.kiln_loading_id) }}</td>
            <td>{{ item.quantity_sold | number }}</td>
            <td><strong>&#8377;{{ item.total_amount | number:'1.2-2' }}</strong></td>
            <td>{{ getEmployeeName(item.driver_id) }} <small class="text-muted">(&#8377;{{ item.driver_wage || 750 }})</small></td>
            <td>{{ getEmployeeName(item.helper_id) }} <small class="text-muted">(&#8377;{{ item.helper_wage || 500 }})</small></td>
            <td>{{ item.sale_date | date:'mediumDate' }}</td>
            <td>
              <span class="badge badge-status"
                [ngClass]="{
                  'bg-success': item.payment_status === 'paid',
                  'bg-warning text-dark': item.payment_status === 'partial',
                  'bg-danger': item.payment_status === 'pending'
                }">
                {{ item.payment_status | titlecase }}
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
      <div *ngIf="sales.length === 0" class="empty-state">
        <i class="fas fa-receipt d-block"></i>
        <p>No sales records found</p>
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
              <h5 class="modal-title">{{ editingItem ? 'Edit' : 'Add' }} Brick Sale</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="form">
                <div class="mb-3">
                  <label class="form-label">Customer *</label>
                  <div *ngIf="selectedCustomer" class="d-flex align-items-center mb-2">
                    <span class="badge bg-info me-2" style="font-size: 0.9rem; padding: 6px 12px;">
                      {{ selectedCustomer.name }}
                    </span>
                    <button class="btn btn-sm btn-outline-secondary" (click)="clearCustomer()">
                      <i class="fas fa-times"></i> Change
                    </button>
                  </div>
                  <div *ngIf="!selectedCustomer">
                    <input type="text" class="form-control" [(ngModel)]="customerSearch"
                      (input)="onCustomerSearch()" placeholder="Type customer name..."
                      [ngModelOptions]="{standalone: true}">
                    <div *ngIf="filteredCustomers.length > 0"
                      style="border: 1px solid #dee2e6; border-radius: 0 0 6px 6px; max-height: 150px; overflow-y: auto; background: white; position: relative; z-index: 10;">
                      <div *ngFor="let c of filteredCustomers" class="px-3 py-2"
                        style="cursor: pointer; border-bottom: 1px solid #f0f0f0;"
                        (click)="selectCustomer(c)">
                        <strong>{{ c.name }}</strong>
                        <small class="text-muted ms-2" *ngIf="c.phone">{{ c.phone }}</small>
                      </div>
                    </div>
                    <div class="mt-1" *ngIf="customerSearch.length >= 1">
                      <button class="btn btn-sm btn-outline-success" (click)="createNewCustomer()">
                        <i class="fas fa-plus me-1"></i> Create "{{ customerSearch }}" as new customer
                      </button>
                    </div>
                  </div>
                  <!-- New customer mini form -->
                  <div *ngIf="showNewCustomerForm" class="card mt-2 p-3" style="background: #f8f9fa; border: 1px dashed #ccc;">
                    <h6>New Customer</h6>
                    <input type="text" class="form-control mb-2" [(ngModel)]="newCustomerName" placeholder="Name *" [ngModelOptions]="{standalone: true}">
                    <input type="text" class="form-control mb-2" [(ngModel)]="newCustomerPhone" placeholder="Phone" [ngModelOptions]="{standalone: true}">
                    <input type="text" class="form-control mb-2" [(ngModel)]="newCustomerAddress" placeholder="Address" [ngModelOptions]="{standalone: true}">
                    <button class="btn btn-success btn-sm" (click)="saveNewCustomer()" [disabled]="!newCustomerName">
                      <i class="fas fa-check me-1"></i> Save Customer
                    </button>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Sell from Kiln *</label>
                  <select class="form-select" formControlName="kiln_loading_id"
                    [ngClass]="{'is-invalid': form.get('kiln_loading_id')?.touched && form.get('kiln_loading_id')?.invalid}">
                    <option value="">Select kiln</option>
                    <option *ngFor="let kl of readyKilns" [value]="kl._id">
                      Kiln {{ kl.kiln_number }} - {{ getKilnRemaining(kl) | number }} bricks available
                    </option>
                  </select>
                  <div class="invalid-feedback">Kiln is required</div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Quantity Sold *</label>
                    <input type="number" class="form-control" formControlName="quantity_sold"
                      [ngClass]="{'is-invalid': form.get('quantity_sold')?.touched && form.get('quantity_sold')?.invalid}">
                    <div class="invalid-feedback">Quantity is required</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Price per 1000 Bricks *</label>
                    <input type="number" step="1" class="form-control" formControlName="price_per_brick"
                      [ngClass]="{'is-invalid': form.get('price_per_brick')?.touched && form.get('price_per_brick')?.invalid}"
                      placeholder="e.g. 8000">
                    <div class="invalid-feedback">Price is required</div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Total Amount</label>
                  <input type="number" step="0.01" class="form-control" formControlName="total_amount" readonly
                    style="background-color: #f8f9fa; font-weight: bold;">
                </div>
                <div class="row">
                  <div class="col-md-8 mb-3">
                    <label class="form-label">Driver</label>
                    <select class="form-select" formControlName="driver_id">
                      <option value="">Select driver</option>
                      <option *ngFor="let emp of allEmployees" [value]="emp._id">{{ emp.name }}</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Driver Wage</label>
                    <input type="number" class="form-control" formControlName="driver_wage">
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-8 mb-3">
                    <label class="form-label">Helper</label>
                    <select class="form-select" formControlName="helper_id">
                      <option value="">Select helper</option>
                      <option *ngFor="let emp of allEmployees" [value]="emp._id">{{ emp.name }}</option>
                    </select>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Helper Wage</label>
                    <input type="number" class="form-control" formControlName="helper_wage">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Sale Date *</label>
                  <input type="date" class="form-control" formControlName="sale_date"
                    [ngClass]="{'is-invalid': form.get('sale_date')?.touched && form.get('sale_date')?.invalid}">
                  <div class="invalid-feedback">Sale date is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Payment Status *</label>
                  <select class="form-select" formControlName="payment_status"
                    [ngClass]="{'is-invalid': form.get('payment_status')?.touched && form.get('payment_status')?.invalid}">
                    <option value="">Select payment status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                  <div class="invalid-feedback">Payment status is required</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Remarks</label>
                  <textarea class="form-control" formControlName="remarks" rows="2"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="button" class="btn btn-brick" (click)="save()" [disabled]="form.invalid || !selectedCustomer">
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
              <p>Are you sure you want to delete this sale record for <strong>{{ getCustomerName(deletingItem?.customer_id) }}</strong>?</p>
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
export class BrickSalesComponent implements OnInit {
  sales: any[] = [];
  kilnLoadings: any[] = [];
  readyKilns: any[] = [];
  allCustomers: any[] = [];
  allEmployees: any[] = [];
  filteredCustomers: any[] = [];
  selectedCustomer: any = null;
  customerSearch = '';
  showNewCustomerForm = false;
  newCustomerName = '';
  newCustomerPhone = '';
  newCustomerAddress = '';
  showModal = false;
  showDeleteConfirm = false;
  editingItem: any = null;
  deletingItem: any = null;
  alertMessage = '';
  alertType = 'success';

  form = new FormGroup({
    kiln_loading_id: new FormControl('', Validators.required),
    quantity_sold: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    price_per_brick: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    total_amount: new FormControl<number | null>({ value: null, disabled: false }),
    driver_id: new FormControl(''),
    driver_wage: new FormControl<number>(750),
    helper_id: new FormControl(''),
    helper_wage: new FormControl<number>(500),
    sale_date: new FormControl('', Validators.required),
    payment_status: new FormControl('', Validators.required),
    remarks: new FormControl('')
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadCustomers();
    this.loadKilnLoadings();
    this.loadEmployees();
    this.setupAutoCalculate();
  }

  setupAutoCalculate(): void {
    this.form.get('quantity_sold')?.valueChanges.subscribe(() => this.calculateTotal());
    this.form.get('price_per_brick')?.valueChanges.subscribe(() => this.calculateTotal());
  }

  calculateTotal(): void {
    const qty = this.form.get('quantity_sold')?.value || 0;
    const pricePer1000 = this.form.get('price_per_brick')?.value || 0;
    const total = (qty / 1000) * pricePer1000;
    this.form.get('total_amount')?.setValue(Math.round(total * 100) / 100, { emitEvent: false });
  }

  loadData(): void {
    this.apiService.getBrickSales().subscribe({
      next: (data) => this.sales = data,
      error: (err) => {
        console.error('Error:', err);
        this.showAlertMsg('Failed to load sales', 'danger');
      }
    });
  }

  loadEmployees(): void {
    this.apiService.getEmployees().subscribe({
      next: (data) => this.allEmployees = data,
      error: () => {}
    });
  }

  getEmployeeName(emp: any): string {
    if (!emp) return '-';
    if (typeof emp === 'object' && emp.name) return emp.name;
    const e = this.allEmployees.find(x => x._id === emp);
    return e ? e.name : '-';
  }

  loadKilnLoadings(): void {
    this.apiService.getKilnLoadings().subscribe({
      next: (data) => {
        this.kilnLoadings = data;
        this.readyKilns = data.filter((kl: any) => kl.status === 'ready' && this.getKilnRemaining(kl) > 0);
      },
      error: () => {}
    });
  }

  getKilnRemaining(kl: any): number {
    return (kl.quantity_loaded || 0) - (kl.quantity_sold || 0);
  }

  loadCustomers(): void {
    this.apiService.getCustomers().subscribe({
      next: (data) => this.allCustomers = data,
      error: (err) => console.error('Error loading customers:', err)
    });
  }

  onCustomerSearch(): void {
    const q = this.customerSearch.trim();
    if (q.length < 1) {
      this.filteredCustomers = this.allCustomers;
      return;
    }
    this.apiService.searchCustomers(q).subscribe({
      next: (data) => this.filteredCustomers = data,
      error: () => this.filteredCustomers = []
    });
  }

  selectCustomer(customer: any): void {
    this.selectedCustomer = customer;
    this.customerSearch = customer.name;
    this.filteredCustomers = [];
    this.showNewCustomerForm = false;
  }

  clearCustomer(): void {
    this.selectedCustomer = null;
    this.customerSearch = '';
    this.filteredCustomers = this.allCustomers;
  }

  createNewCustomer(): void {
    this.showNewCustomerForm = true;
    this.newCustomerName = this.customerSearch;
  }

  saveNewCustomer(): void {
    this.apiService.createCustomer({
      name: this.newCustomerName,
      phone: this.newCustomerPhone,
      address: this.newCustomerAddress
    }).subscribe({
      next: (customer) => {
        this.selectCustomer(customer);
        this.showNewCustomerForm = false;
        this.loadCustomers();
        this.showAlertMsg('Customer created', 'success');
      },
      error: () => this.showAlertMsg('Failed to create customer', 'danger')
    });
  }

  getKilnLabel(kilnLoading: any): string {
    if (!kilnLoading) return '-';
    if (typeof kilnLoading === 'object') return 'Kiln ' + (kilnLoading.kiln_number || '?');
    const kl = this.kilnLoadings.find(k => k._id === kilnLoading);
    return kl ? 'Kiln ' + kl.kiln_number : '-';
  }

  getCustomerName(customerId: any): string {
    if (!customerId) return '-';
    if (typeof customerId === 'object' && customerId.name) return customerId.name;
    const c = this.allCustomers.find(x => x._id === customerId);
    return c ? c.name : '-';
  }

  openModal(item?: any): void {
    this.editingItem = item || null;
    this.selectedCustomer = null;
    this.customerSearch = '';
    this.filteredCustomers = this.allCustomers;
    this.showNewCustomerForm = false;
    this.newCustomerName = '';
    this.newCustomerPhone = '';
    this.newCustomerAddress = '';

    if (item) {
      const customer = typeof item.customer_id === 'object' ? item.customer_id : null;
      if (customer) {
        this.selectedCustomer = customer;
        this.customerSearch = customer.name;
      }
      const kilnId = item.kiln_loading_id && typeof item.kiln_loading_id === 'object'
        ? item.kiln_loading_id._id : (item.kiln_loading_id || '');
      this.form.patchValue({
        kiln_loading_id: kilnId,
        quantity_sold: item.quantity_sold,
        price_per_brick: item.price_per_brick,
        total_amount: item.total_amount,
        driver_id: item.driver_id ? (typeof item.driver_id === 'object' ? item.driver_id._id : item.driver_id) : '',
        driver_wage: item.driver_wage ?? 750,
        helper_id: item.helper_id ? (typeof item.helper_id === 'object' ? item.helper_id._id : item.helper_id) : '',
        helper_wage: item.helper_wage ?? 500,
        sale_date: item.sale_date ? item.sale_date.substring(0, 10) : '',
        payment_status: item.payment_status,
        remarks: item.remarks || ''
      });
    } else {
      this.form.reset();
      this.form.patchValue({ driver_wage: 750, helper_wage: 500 });
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.form.reset();
    this.selectedCustomer = null;
    this.customerSearch = '';
    this.filteredCustomers = [];
    this.showNewCustomerForm = false;
  }

  save(): void {
    if (this.form.invalid || !this.selectedCustomer) return;
    const data = {
      ...this.form.getRawValue(),
      customer_id: this.selectedCustomer._id
    };

    if (this.editingItem) {
      this.apiService.updateBrickSale(this.editingItem._id, data).subscribe({
        next: () => {
          this.showAlertMsg('Sale updated successfully', 'success');
          this.closeModal();
          this.loadData();
          this.loadKilnLoadings();
        },
        error: (err) => {
          console.error('Error:', err);
          const msg = err.error?.error || 'Failed to update sale';
          this.showAlertMsg(msg, 'danger');
        }
      });
    } else {
      this.apiService.createBrickSale(data).subscribe({
        next: () => {
          this.showAlertMsg('Sale created successfully', 'success');
          this.closeModal();
          this.loadData();
          this.loadKilnLoadings();
        },
        error: (err) => {
          console.error('Error:', err);
          const msg = err.error?.error || 'Failed to create sale';
          this.showAlertMsg(msg, 'danger');
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
    this.apiService.deleteBrickSale(this.deletingItem._id).subscribe({
      next: () => {
        this.showAlertMsg('Sale deleted successfully', 'success');
        this.showDeleteConfirm = false;
        this.deletingItem = null;
        this.loadData();
        this.loadKilnLoadings();
      },
      error: (err) => {
        console.error('Error:', err);
        this.showAlertMsg('Failed to delete sale', 'danger');
        this.showDeleteConfirm = false;
      }
    });
  }

  showAlertMsg(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 3000);
  }
}
