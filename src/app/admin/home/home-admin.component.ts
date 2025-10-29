import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from '../../layout/header/header.component';
import { OnInit } from '@angular/core';
import { AuthService } from '../../api/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-oderlist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderAdminComponent],
  templateUrl: 'home-admin.component.html',
  styleUrls: ['./home-admin.component.css'],
})
export class HomeListComponent {
  usercheckins: any[] = [];
  allCheckins: any[] = [];
  error: string = '';
  framedImage: string | null = null;
  subjects: Array<{ id: number; name: string }> = [];
  classes: Array<{ id: number; name: string }> = [];
  selectedSubjectId: number | null = null;
  selectedClassId: number | null = null;

  constructor(private authService: AuthService) {
    this.loadUserCheckIn();
  }

  loadUserCheckIn() {
    this.authService.get_checkinsface().subscribe({
      next: (data: any) => {
        this.allCheckins = Array.isArray(data) ? data : data.results || [];
        this.applyFilters();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Lỗi khi tải danh sách điểm danh';
      },
    });
  }

  ngOnInit() {
    this.loadSubjects();
    this.loadClasses();
  }

  loadSubjects() {
    this.authService.getSubjects().subscribe({
      next: (data: any) => {
        const arr = Array.isArray(data) ? data : data.results || [];
        this.subjects = arr.map((s: any) => ({ id: s.id, name: s.name }));
      },
      error: () => {},
    });
  }

  loadClasses() {
    // public endpoint, no auth required
    fetch('http://127.0.0.1:8000/api/classes/')
      .then((r) => r.json())
      .then((arr) => {
        this.classes = Array.isArray(arr) ? arr.map((c: any) => ({ id: c.id, name: c.name })) : [];
      })
      .catch(() => {});
  }

  onSubjectFilterChange() {
    this.applyFilters();
  }
  onClassFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let list = this.allCheckins.slice();
    if (this.selectedSubjectId) {
      const subj = this.subjects.find((s) => s.id === this.selectedSubjectId)?.name;
      list = list.filter(
        (ci) => ci.subject === this.selectedSubjectId || (subj && ci.subject_name === subj)
      );
    }
    if (this.selectedClassId) {
      list = list.filter(
        (ci) =>
          ci.user_face?.class_name === this.selectedClassId ||
          (ci.user_face?.class_name_name &&
            this.classes.find((c) => c.id === this.selectedClassId)?.name ===
              ci.user_face.class_name_name)
      );
    }
    this.usercheckins = list;
  }

  deleteUserCheck(event: Event, id: number) {
    // Ngăn điều hướng mặc định của thẻ <a>/<button> trong dropdown
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này không?')) {
      this.authService.deleteUserCheckIn(id).subscribe({
        next: () => {
          this.usercheckins = this.usercheckins.filter((o) => o.id !== id);
        },
        error: (err) => {
          alert(err.error?.detail || 'Xóa bản ghi thất bại');
        },
      });
    }
  }

  formatLateText(item: any): string {
    const late = Number(item?.minutes_late || 0);
    // Nếu số phút trễ <= 0 thì luôn coi là đúng giờ
    if (late <= 0) return 'Đúng giờ';

    if (late >= 60) {
      const hours = Math.floor(late / 60);
      const minutes = late % 60;
      return minutes > 0 ? `Trễ ${hours} giờ ${minutes} phút` : `Trễ ${hours} giờ`;
    }
    return `Trễ ${late} phút`;
  }
}
