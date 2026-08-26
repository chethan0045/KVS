import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-wage-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div *ngIf="alertMessage" class="alert alert-floating" [ngClass]="'alert-' + alertType" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close btn-sm float-end" (click)="alertMessage = ''"></button>
    </div>

    <div class="page-header">
      <h2><i class="fas fa-coins me-2"></i>Wage Settings</h2>
    </div>

    <div class="alert alert-warning" style="border-radius: 10px;">
      <i class="fas fa-info-circle me-1"></i>
      New rates apply only to records created after saving. Existing records keep the
      rates they were created with, so past wages and balances are not affected.
    </div>

    <form [formGroup]="form">
      <div class="row g-4">
        <!-- Per-brick rates -->
        <div class="col-lg-6">
          <div class="card h-100" style="border: none; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <div class="card-body">
              <h5 style="color: #c0392b; font-weight: 700;"><i class="fas fa-cubes me-2"></i>Per-Brick Rates</h5>
              <div class="mb-3 mt-3">
                <label class="form-label">Brick Production (&#8377; per brick) *</label>
                <input type="number" step="0.01" min="0" class="form-control" formControlName="production_rate"
                  [ngClass]="{'is-invalid': isInvalid('production_rate')}">
                <div class="invalid-feedback">A non-negative rate is required</div>
              </div>
              <div class="mb-3">
                <label class="form-label">Kiln Loading (&#8377; per brick) *</label>
                <input type="number" step="0.01" min="0" class="form-control" formControlName="kiln_loading_rate"
                  [ngClass]="{'is-invalid': isInvalid('kiln_loading_rate')}">
                <div class="invalid-feedback">A non-negative rate is required</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Brick sale delivery -->
        <div class="col-lg-6">
          <div class="card h-100" style="border: none; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <div class="card-body">
              <h5 style="color: #2c3e50; font-weight: 700;"><i class="fas fa-truck me-2"></i>Brick Sale Delivery (per trip)</h5>
              <div class="mb-3 mt-3">
                <label class="form-label">Driver Wage (&#8377;) *</label>
                <input type="number" step="1" min="0" class="form-control" formControlName="driver_wage"
                  [ngClass]="{'is-invalid': isInvalid('driver_wage')}">
                <div class="invalid-feedback">A non-negative amount is required</div>
              </div>
              <div class="mb-3">
                <label class="form-label">Helper Wage (&#8377;) *</label>
                <input type="number" step="1" min="0" class="form-control" formControlName="helper_wage"
                  [ngClass]="{'is-invalid': isInvalid('helper_wage')}">
                <div class="invalid-feedback">A non-negative amount is required</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Kiln work flat wages -->
        <div class="col-12">
          <div class="card" style="border: none; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <div class="card-body">
              <h5 style="color: #8B4513; font-weight: 700;"><i class="fas fa-fire me-2"></i>Kiln Work (flat &#8377; per record, split among workers)</h5>
              <div class="row g-3 mt-1">
                <div class="col-md-3 col-6">
                  <label class="form-label">Husk Loading *</label>
                  <input type="number" step="1" min="0" class="form-control" formControlName="husk_loading_wage"
                    [ngClass]="{'is-invalid': isInvalid('husk_loading_wage')}">
                  <div class="invalid-feedback">Required</div>
                </div>
                <div class="col-md-3 col-6">
                  <label class="form-label">DBA *</label>
                  <input type="number" step="1" min="0" class="form-control" formControlName="dba_wage"
                    [ngClass]="{'is-invalid': isInvalid('dba_wage')}">
                  <div class="invalid-feedback">Required</div>
                </div>
                <div class="col-md-3 col-6">
                  <label class="form-label">Wall *</label>
                  <input type="number" step="1" min="0" class="form-control" formControlName="wall_wage"
                    [ngClass]="{'is-invalid': isInvalid('wall_wage')}">
                  <div class="invalid-feedback">Required</div>
                </div>
                <div class="col-md-3 col-6">
                  <label class="form-label">Cleaning *</label>
                  <input type="number" step="1" min="0" class="form-control" formControlName="cleaning_wage"
                    [ngClass]="{'is-invalid': isInvalid('cleaning_wage')}">
                  <div class="invalid-feedback">Required</div>
                </div>
              </div>
              <small class="text-muted d-block mt-2">
                These auto-fill the wages field on the Kiln Manufacturing page when a work type is selected. You can still override the amount on each record.
              </small>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <button type="button" class="btn btn-brick" (click)="save()" [disabled]="form.invalid || saving">
          <i class="fas fa-save me-1"></i> {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </form>
  `
})
export class WageSettingsComponent implements OnInit {
  alertMessage = '';
  alertType = 'success';
  saving = false;

  form = new FormGroup({
    production_rate: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    kiln_loading_rate: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    driver_wage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    helper_wage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    husk_loading_wage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    dba_wage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    wall_wage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    cleaning_wage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)])
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getWageSettings().subscribe({
      next: (data) => this.form.patchValue(data),
      error: () => this.showAlert('Failed to load wage settings', 'danger')
    });
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!(c && c.touched && c.invalid);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.apiService.updateWageSettings(this.form.value).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.saving = false;
        this.showAlert('Wage settings saved. New rates apply to records created from now on.', 'success');
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.error || 'Failed to save wage settings', 'danger');
      }
    });
  }

  showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 4000);
  }
}
