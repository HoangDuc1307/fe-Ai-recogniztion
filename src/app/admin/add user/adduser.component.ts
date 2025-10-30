import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../api/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from '../../layout/header/header.component';

@Component({
  selector: 'app-add_product', // *Lưu ý: Tên selector này vẫn là 'app-add_product' như file cũ của bạn*
  imports: [FormsModule, CommonModule, SidebarComponent, HeaderAdminComponent],
  templateUrl: './adduser.component.html',
  styleUrls: ['./adduser.component.css'],
  standalone: true,
})
export class AddUserComponent {
  
  // 1. Model (Dùng cho [(ngModel)] trên form)
  user = {
    student_id: '',
    full_name: '',
    className: '',
    faceimage: '', // Dùng để hiển thị ảnh preview
    email: '',
  };

  // 2. Biến trạng thái
  message: string = '';
  isError: boolean = false;
  isLoading: boolean = false;

  // 3. Biến để lưu file đã chọn
  selectedFile: File | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  // 4. Hàm này được gọi khi người dùng chọn file (từ input type="file")
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      
      // (Tùy chọn) Hiển thị ảnh preview ngay khi chọn
      const reader = new FileReader();
      reader.onload = (e: any) => { 
        this.user.faceimage = e.target.result; // Cập nhật ảnh preview
      };
      reader.readAsDataURL(this.selectedFile!);
    }
  }

  // 5. Hàm này được gọi khi nhấn nút "Thêm" (đã sửa)
  addUser() {
    this.isLoading = true;
    this.message = '';
    this.isError = false;

    // --- Tạo FormData ---
    // Đây là cách duy nhất để gửi file lên server
    const formData = new FormData();

    // --- Thêm các trường dữ liệu text vào FormData ---
    formData.append('student_id', this.user.student_id);
    formData.append('full_name', this.user.full_name);
    formData.append('email', this.user.email);

    // [SỬA LỖI class_id]
    // Gửi giá trị của 'className' (từ form) với key là 'class_id' (backend yêu cầu)
    formData.append('class_id', this.user.className); 

    // [SỬA LỖI face_image]
    // Gửi file đã chọn với key là 'face_image' (backend yêu cầu)
    if (this.selectedFile) {
      formData.append('face_image', this.selectedFile, this.selectedFile.name);
    } else {
      // Bắt lỗi nếu người dùng chưa chọn file
      this.isError = true;
      this.message = 'Lỗi: Vui lòng chọn hình ảnh.';
      this.isLoading = false;
      return;
    }

    // --- Gửi FormData đến Service ---
    this.authService.adduser(formData).subscribe({
      next: (response: any) => { 
        this.isLoading = false;
        this.isError = false;
        this.message = `✅ Đã thêm người dùng ${this.user.full_name} thành công!`;
        
        // Tự động chuyển hướng sau 1.5 giây
        setTimeout(() => {
          this.router.navigate(['/user-list']); // *Thay '/user-list' bằng route danh sách user của bạn*
        }, 1500); 
      },
      error: (err: any) => { 
        this.isLoading = false;
        this.isError = true;
        
        // Hiển thị lỗi 400 chi tiết (lấy từ response của backend)
        const errors = err.error;
        if (errors && errors.student_id) {
            this.message = `Lỗi Mã SV: ${errors.student_id[0]}`; // Ví dụ: "Mã SV đã tồn tại"
        } else if (errors && errors.email) {
            this.message = `Lỗi Email: ${errors.email[0]}`; // Ví dụ: "Email không hợp lệ"
        } else if (errors && errors.face_image) {
            this.message = `Lỗi Ảnh: ${errors.face_image[0]}`; // Ví dụ: "File không hợp lệ"
        } else if (errors && errors.class_id) {
            this.message = `Lỗi Lớp: ${errors.class_id[0]}`; // Ví dụ: "Lớp không tồn tại"
        } else {
            this.message = '❌ Lỗi không xác định. Không thể thêm người dùng.';
        }
        console.error('Lỗi khi thêm người dùng:', err);
      }
    });
  }
}