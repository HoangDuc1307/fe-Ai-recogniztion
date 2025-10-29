import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from '../../layout/header/header.component';
import { AuthService } from '../../api/auth.service';

interface ClassDto {
  id: number;
  name: string;
}
interface SubjectDto {
  id: number;
  name: string;
  time_start: string;
  time_end: string;
  day_of_week: string;
  classes: number[];
}

@Component({
  selector: 'app-subject-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderAdminComponent],
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.css'],
})
export class SubjectAdminComponent implements OnInit {
  apiUrl = 'http://127.0.0.1:8000/api';
  classes: ClassDto[] = [];
  subjects: SubjectDto[] = [];
  dayOptions = [
    { value: 'Monday', label: 'Thứ Hai' },
    { value: 'Tuesday', label: 'Thứ Ba' },
    { value: 'Wednesday', label: 'Thứ Tư' },
    { value: 'Thursday', label: 'Thứ Năm' },
    { value: 'Friday', label: 'Thứ Sáu' },
    { value: 'Saturday', label: 'Thứ Bảy' },
    { value: 'Sunday', label: 'Chủ Nhật' },
  ];
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutes: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // form state
  name = '';
  day_of_week = '';
  time_start = ''; // backend format "HH:MM"
  time_end = '';
  startHour: number | null = null; // UI VN style (e.g., 13h)
  startMinute: number | null = null;
  endHour: number | null = null;
  endMinute: number | null = null;
  selectedClassIds: number[] = [];

  message = '';

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadSubjects();
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  loadClasses() {
    this.http.get<ClassDto[]>(`${this.apiUrl}/classes/`).subscribe({
      next: (res) => (this.classes = res),
      error: () => (this.message = 'Không thể tải danh sách lớp'),
    });
  }

  loadSubjects() {
    this.http.get<SubjectDto[]>(`${this.apiUrl}/subjects/`).subscribe({
      next: (res) => (this.subjects = res),
      error: () => {},
    });
  }

  deleteSubject(id: number) {
    if (!confirm('Xóa môn học này?')) return;
    this.http.delete(`${this.apiUrl}/subjects/${id}/`, { headers: this.authHeaders() }).subscribe({
      next: () => {
        this.subjects = this.subjects.filter((s) => s.id !== id);
        this.message = 'Đã xóa môn học';
      },
      error: (err) => {
        this.message = err?.error?.detail || 'Xóa môn học thất bại (cần quyền admin)';
      },
    });
  }

  toggleClassSelection(classId: number, checked: boolean) {
    if (checked) {
      if (!this.selectedClassIds.includes(classId)) this.selectedClassIds.push(classId);
    } else {
      this.selectedClassIds = this.selectedClassIds.filter((id) => id !== classId);
    }
  }

  submit() {
    // Map VN hour pickers to backend HH:MM
    if (this.startHour != null && this.startMinute != null) {
      const hh = String(this.startHour).padStart(2, '0');
      const mm = String(this.startMinute).padStart(2, '0');
      this.time_start = `${hh}:${mm}`;
    }

    if (this.endHour != null && this.endMinute != null) {
      const hh = String(this.endHour).padStart(2, '0');
      const mm = String(this.endMinute).padStart(2, '0');
      this.time_end = `${hh}:${mm}`;
    }

    if (
      !this.name ||
      !this.day_of_week ||
      !this.time_start ||
      !this.time_end ||
      this.selectedClassIds.length === 0
    ) {
      this.message = 'Vui lòng nhập đủ thông tin và chọn ít nhất một lớp';
      return;
    }
    // Validate end after start
    const [sh, sm] = this.time_start.split(':').map(Number);
    const [eh, em] = this.time_end.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      this.message = 'Giờ kết thúc phải sau giờ bắt đầu';
      return;
    }
    const body = {
      name: this.name,
      day_of_week: this.day_of_week,
      time_start: this.time_start,
      time_end: this.time_end,
      classes: this.selectedClassIds,
    };
    this.http
      .post<SubjectDto>(`${this.apiUrl}/subjects/`, body, { headers: this.authHeaders() })
      .subscribe({
        next: (res) => {
          this.message = 'Thêm môn học thành công';
          this.subjects = [res, ...this.subjects];
          this.resetForm();
        },
        error: (err) => {
          this.message = err?.error?.detail || 'Thêm môn học thất bại (cần quyền admin)';
        },
      });
  }

  private resetForm() {
    this.name = '';
    this.day_of_week = '';
    this.time_start = '';
    this.startMinute = null;
    this.time_end = '';
    this.endMinute = null;
    this.startHour = null;
    this.endHour = null;
    this.selectedClassIds = [];
  }

  getClassNameById(id: number): string {
    const found = this.classes.find((c) => c.id === id);
    return found ? found.name : String(id);
  }

  getDayLabel(value: string): string {
    const d = this.dayOptions.find((o) => o.value === value);
    return d ? d.label : value;
  }

  formatViHour(value: string): string {
    // value like "13:00" or "13:00:00"
    if (!value) return '';
    const [hh, mm] = value.split(':');
    return `${hh}h${mm}p`;
  }
}
