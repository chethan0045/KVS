import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductionComponent } from './pages/production/production.component';
import { KilnLoadingComponent } from './pages/kiln-loading/kiln-loading.component';
import { KilnManufactureComponent } from './pages/kiln-manufacture/kiln-manufacture.component';
import { BrickSalesComponent } from './pages/brick-sales/brick-sales.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { WagesReportComponent } from './pages/wages-report/wages-report.component';
import { CustomerComponent } from './pages/customer/customer.component';
import { HuskLoadComponent } from './pages/husk-load/husk-load.component';
import { LoginComponent } from './pages/login/login.component';
import { OldRecordsComponent } from './pages/old-records/old-records.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'production', component: ProductionComponent, canActivate: [authGuard] },
  { path: 'kiln-loading', component: KilnLoadingComponent, canActivate: [authGuard] },
  { path: 'kiln-manufacture', component: KilnManufactureComponent, canActivate: [authGuard] },
  { path: 'brick-sales', component: BrickSalesComponent, canActivate: [authGuard] },
  { path: 'employees', component: EmployeeComponent, canActivate: [authGuard] },
  { path: 'wages-report', component: WagesReportComponent, canActivate: [authGuard] },
  { path: 'customers', component: CustomerComponent, canActivate: [authGuard] },
  { path: 'husk-loads', component: HuskLoadComponent, canActivate: [authGuard] },
  { path: 'old-records', component: OldRecordsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
