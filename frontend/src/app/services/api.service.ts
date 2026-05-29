import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard`);
  }

  // Productions
  getProductions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/productions`);
  }

  getProduction(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/productions/${id}`);
  }

  createProduction(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/productions`, data);
  }

  updateProduction(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/productions/${id}`, data);
  }

  deleteProduction(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/productions/${id}`);
  }

  // Kiln Loadings
  getKilnLoadings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/kiln-loadings`);
  }

  getKilnLoading(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/kiln-loadings/${id}`);
  }

  createKilnLoading(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/kiln-loadings`, data);
  }

  updateKilnLoading(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/kiln-loadings/${id}`, data);
  }

  deleteKilnLoading(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/kiln-loadings/${id}`);
  }

  updateKilnStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/kiln-loadings/${id}/status`, { status });
  }

  // Kiln Manufactures
  getKilnManufactures(): Observable<any> {
    return this.http.get(`${this.baseUrl}/kiln-manufactures`);
  }

  getKilnManufacture(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/kiln-manufactures/${id}`);
  }

  createKilnManufacture(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/kiln-manufactures`, data);
  }

  updateKilnManufacture(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/kiln-manufactures/${id}`, data);
  }

  deleteKilnManufacture(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/kiln-manufactures/${id}`);
  }

  // Brick Sales
  getBrickSales(): Observable<any> {
    return this.http.get(`${this.baseUrl}/brick-sales`);
  }

  getBrickSale(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/brick-sales/${id}`);
  }

  createBrickSale(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/brick-sales`, data);
  }

  updateBrickSale(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/brick-sales/${id}`, data);
  }

  deleteBrickSale(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/brick-sales/${id}`);
  }

  // Employees
  getEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees`);
  }

  getEmployee(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${id}`);
  }

  createEmployee(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees`, data);
  }

  updateEmployee(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, data);
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`);
  }

  // Employee Payment
  payEmployee(id: string, amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees/${id}/pay`, { amount });
  }

  // Wages Report
  getWagesReport(params?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/wages-report`, { params });
  }

  // Customers
  getCustomers(): Observable<any> { return this.http.get(`${this.baseUrl}/customers`); }
  searchCustomers(query: string): Observable<any> { return this.http.get(`${this.baseUrl}/customers/search`, { params: { q: query } }); }
  getCustomer(id: string): Observable<any> { return this.http.get(`${this.baseUrl}/customers/${id}`); }
  createCustomer(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/customers`, data); }
  updateCustomer(id: string, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/customers/${id}`, data); }
  deleteCustomer(id: string): Observable<any> { return this.http.delete(`${this.baseUrl}/customers/${id}`); }
  payCustomer(id: string, amount: number): Observable<any> { return this.http.post(`${this.baseUrl}/customers/${id}/pay`, { amount }); }

  // Husk Loads
  getHuskLoads(): Observable<any> { return this.http.get(`${this.baseUrl}/husk-loads`); }
  createHuskLoad(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/husk-loads`, data); }
  updateHuskLoad(id: string, data: any): Observable<any> { return this.http.put(`${this.baseUrl}/husk-loads/${id}`, data); }
  deleteHuskLoad(id: string): Observable<any> { return this.http.delete(`${this.baseUrl}/husk-loads/${id}`); }
  payHuskLoad(id: string, amount: number): Observable<any> { return this.http.post(`${this.baseUrl}/husk-loads/${id}/pay`, { amount }); }

  // Archives
  getArchives(): Observable<any> { return this.http.get(`${this.baseUrl}/archives`); }
  getArchive(id: string): Observable<any> { return this.http.get(`${this.baseUrl}/archives/${id}`); }
  createArchive(data: any): Observable<any> { return this.http.post(`${this.baseUrl}/archives`, data); }
  deleteArchive(id: string): Observable<any> { return this.http.delete(`${this.baseUrl}/archives/${id}`); }
}
