import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../api/auth.service';

@Component({
  selector: 'app-headeradmin',
  standalone: true,
  imports: [RouterModule], 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderAdminComponent {
  constructor(public authService: AuthService, private router: Router) {}
  logout() {
    this.authService.logout().subscribe({
      next: (res: any) => {
        console.log('Đăng xuất thành công:', res.message);
        this.authService.clearLocalStorage();
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        console.error('Lỗi đăng xuất:', err);
        this.authService.clearLocalStorage();
        this.router.navigate(['/']);
      }
    });
  }
}
