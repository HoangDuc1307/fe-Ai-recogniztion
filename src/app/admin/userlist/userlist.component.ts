
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from '../../layout/header/header.component';
import { AuthService } from '../../api/auth.service';


@Component({
  selector: 'app-userlist',
  standalone: true,
  imports:[CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderAdminComponent],
  templateUrl:'userlist.component.html',
  styleUrls: ['./userlist.component.css'],
  

})
export class UserListComponent {
  users: any[] = [];
  error = '';
  classes: Array<{id:number; name:string}> = [];

  // detail/edit state
  selectedUser: any | null = null;
  editFullName = '';
  editStudentId = '';
  editClassId: number | null = null;

  constructor(private auth: AuthService) {
    this.loadUsers();
    this.loadClasses();
  }

  loadUsers() {
    this.auth.getUserFaces().subscribe({
      next: (data: any) => {
        this.users = Array.isArray(data) ? data : (data.results || []);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Không thể tải danh sách sinh viên (cần quyền admin)';
      }
    });
  }

  buildImageUrl(path: string | null | undefined): string {
    if (!path) return '../assets/images/dashboard/avatar-1.png';
    // if path already absolute
    if (path.startsWith('http')) return path;
    // normalize duplicate /media/
    const normalized = path.replace('/media/media/', '/media/');
    return `http://127.0.0.1:8000${normalized}`;
  }

  loadClasses() {
    this.auth.getClasses().subscribe({
      next: (arr:any) => {
        this.classes = Array.isArray(arr) ? arr.map((c:any)=>({id:c.id, name:c.name})) : [];
      },
      error: () => {}
    })
  }

  openDetail(user: any) {
    this.selectedUser = user;
    this.editFullName = user.full_name || '';
    this.editStudentId = user.student_id || '';
    // class: prefer id if backend returns, else try match by name
    const className = user.class_name_name || user.class_name || null;
    if (typeof className === 'number') {
      this.editClassId = className;
    } else if (className) {
      const found = this.classes.find(c=>c.name === className);
      this.editClassId = found ? found.id : null;
    } else {
      this.editClassId = null;
    }
  }

  cancelEdit() {
    this.selectedUser = null;
    this.editFullName = '';
    this.editStudentId = '';
    this.editClassId = null;
  }

  saveEdit() {
    if (!this.selectedUser) return;
    const payload: any = {
      full_name: this.editFullName,
      student_id: this.editStudentId,
    };
    if (this.editClassId) payload.class_name = this.editClassId;
    this.auth.updateUserFace(this.selectedUser.id, payload).subscribe({
      next: (res:any) => {
        // update list in place
        const idx = this.users.findIndex(u=>u.id===this.selectedUser!.id);
        if (idx >= 0) this.users[idx] = res;
        this.cancelEdit();
      },
      error: (err) => {
        alert(err?.error?.detail || 'Cập nhật thất bại');
      }
    })
  }
}
