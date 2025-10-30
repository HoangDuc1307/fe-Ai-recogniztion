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

  clearLocalStorage():void{
    localStorage.removeItem('access_token')
     localStorage.removeItem('refresh_token')
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
  
  getUserFaces(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/userfaces/`, { headers });
  }

  deleteUserFace(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/userfaces/${id}/`, { headers });
  }
  
  getSubjects(): Observable<any> {
    // GET subjects is allowed for all; keep auth header if present
    return this.http.get(`${this.apiUrl}/subjects/`);
  }

  getClasses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/`);
  }

  updateUserFace(id: number, body: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/userfaces/${id}/`, body, { headers });
  }

  adduser(userData: any):Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/userfaces/`, userData, { headers });
  }
  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      return this.http.post(`${this.apiUrl}/logout/`, { refresh: refreshToken });
    }
    this.clearLocalStorage();
    return new Observable(observer => {
      observer.next({ message: 'Đăng xuất thành công' });
      observer.complete();
    });
  }

  // Làm mới access token
  refreshToken(refresh: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/token/refresh/`, { refresh });
  }
    
}