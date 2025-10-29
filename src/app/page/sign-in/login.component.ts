import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router,RouterModule } from '@angular/router';
import { AuthService } from '../../api/auth.service';   

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ FormsModule, CommonModule,RouterModule]
})
export class LoginComponent {
    username = '';
    password = '';
    message = '';
    error = '';

    constructor(private authService: AuthService, private router: Router) {}
    
    onSubmit(): void {
        this.authService.login({ username: this.username, password: this.password })
      .subscribe({
        next: (res) => { 
          this.message = res.message; 
          
          // Hiển thị tokens trong console
          console.log('Access Token:', res.access);
          console.log('Refresh Token:', res.refresh);
          console.log('User info:', res.user);
          
          // Lưu JWT tokens và thông tin user vào localStorage
          this.authService.saveTokens(res.access, res.refresh, res.user);
        this.router.navigate(['/homelist']);
        },
        error: (err) => { 
          this.error = err.error?.error || 'Đăng nhập thất bại'; 
        }
      });
  }
}