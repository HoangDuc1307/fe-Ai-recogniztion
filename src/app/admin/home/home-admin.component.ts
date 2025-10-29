
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from '../../layout/header/header.component';
import { OnInit } from '@angular/core';
import {AuthService} from '../../api/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-oderlist',
  standalone: true,
  imports:[CommonModule, FormsModule, RouterModule,SidebarComponent,HeaderAdminComponent],
  templateUrl:'home-admin.component.html',
  styleUrls: ['./home-admin.component.css'],
})
export class HomeListComponent  {
   usercheckins: any[] = [];
   error: string ='';
   framedImage: string | null = null;

    constructor(private authService: AuthService) {
    this.loadUserCheckIn();
    }
      

    loadUserCheckIn() {
        this.authService.get_checkinsface().subscribe({
        next: (data:any) => {
            this.usercheckins = Array.isArray(data) ? data :(data.results || []);
        },
        error: (err) => {
            this.error = err.error?.detail || 'Lỗi khi tải danh sách điểm danh';
        }
        })
    }

    deleteUserCheck(event: Event, id: number) {
        // Ngăn điều hướng mặc định của thẻ <a>/<button> trong dropdown
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if(window.confirm('Bạn có chắc chắn muốn xóa bản ghi này không?')) {
            this.authService.deleteUserCheckIn(id).subscribe({
                next: () => {
                    this.usercheckins = this.usercheckins.filter(o => o.id !== id);
                },
                error: (err) => {
                    alert(err.error?.detail || 'Xóa bản ghi thất bại');
                }
            });
    }
}
}
