import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';

    constructor(private http: HttpClient) {}

    login(data: { username: string; password: string; }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, data);
  }
    saveTokens(access: string, refresh: string, user: any): void {
    try {
      if (access) {
        localStorage.setItem('access_token', access);
      }
      if (refresh) {
        localStorage.setItem('refresh_token', refresh);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (e) {
      console.error('Failed to save tokens to localStorage', e);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Tạo headers với JWT token
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }
  
  get_checkinsface(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/checkins/`, { headers });
  }

  deleteUserCheckIn(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/checkins/${id}/`, { headers });
  }
  
    
}