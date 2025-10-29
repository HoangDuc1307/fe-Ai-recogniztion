import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class AttendanceComponent implements OnInit, OnDestroy {
  videoElement!: HTMLVideoElement;
  faceCanvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  stream: MediaStream | null = null;

  message = '';
  fullName = '';
  studentId = '';
  time = '';
  lastDetected = 0;
  framedImage: string | null = null;
  framedImageTimeout: any = null;

  classes: Array<{ id: number; name: string }> = [];
  subjects: Array<{ id: number; name: string; classes?: number[] }> = [];
  filteredSubjects: Array<{ id: number; name: string; classes?: number[] }> = [];
  selectedClassId: number | null = null;
  selectedSubjectId: number | null = null;
  private frameTimer: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Không mở camera ngay. Bắt buộc chọn lớp trước.
    this.fetchClasses();
    this.fetchSubjects();
  }

  ngOnDestroy() {
    this.stopCamera();
    if (this.framedImageTimeout) {
      clearTimeout(this.framedImageTimeout);
      this.framedImageTimeout = null;
    }
    if (this.frameTimer) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
    }
  }

  onClassChange() {
    // Giữ lại cho tương thích nếu cần; không tự mở camera
    if (this.selectedClassId) {
      this.filteredSubjects = this.subjects.filter(s => !s.classes || s.classes.includes(this.selectedClassId!));
      this.message = 'Đã chọn lớp, hãy chọn môn và mở camera.';
    } else {
      this.filteredSubjects = this.subjects;
      this.message = 'Vui lòng chọn môn trước khi điểm danh.';
      this.stopCamera();
    }
  }

  onSubjectChange() {
    if (!this.selectedSubjectId) {
      this.message = 'Vui lòng chọn môn trước khi điểm danh.';
      this.stopCamera();
      return;
    }
    const subj = this.subjects.find(s => s.id === this.selectedSubjectId);
    // Suy ra lớp từ môn (nếu có danh sách lớp)
    if (subj && subj.classes && subj.classes.length > 0) {
      this.selectedClassId = subj.classes[0];
    }
    this.message = 'Đã chọn môn. Nhấn Mở camera để bắt đầu điểm danh.';
  }

  private fetchClasses() {
    this.http.get<any>('http://127.0.0.1:8000/api/subjects/').subscribe({
      next: (res) => {
        this.classes = res;
        this.message = 'Vui lòng chọn lớp trước khi điểm danh.';
      },
      error: () => {
        this.message = 'Không thể tải danh sách lớp.';
      },
    });
  }

  private fetchSubjects() {
    this.http.get<any>('http://127.0.0.1:8000/api/subjects/').subscribe({
      next: (res) => {
        this.subjects = res;
        if (this.selectedClassId) {
          this.filteredSubjects = this.subjects.filter(s => !s.classes || s.classes.includes(this.selectedClassId!));
        }
      },
      error: () => {
        // giữ im lặng
      },
    });
  }

  async startCamera() {
    if (!this.selectedSubjectId) {
      this.message = 'Vui lòng chọn môn học trước khi điểm danh.';
      return;
    }
    try {
      // Gán element
      this.videoElement = document.querySelector('video')!;
      this.faceCanvas = document.getElementById('faceCanvas') as HTMLCanvasElement;
      this.ctx = this.faceCanvas.getContext('2d')!;

      // Mở camera
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      // Khi video đã sẵn sàng → đồng bộ kích thước canvas
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.width = this.videoElement.videoWidth;
        this.videoElement.height = this.videoElement.videoHeight;
        this.faceCanvas.width = this.videoElement.videoWidth;
        this.faceCanvas.height = this.videoElement.videoHeight;
      };

      if (this.frameTimer) {
        clearInterval(this.frameTimer);
      }
      this.frameTimer = setInterval(() => this.captureFrame(), 10000);
    } catch (err) {
      console.error('Lỗi mở camera:', err);
      this.message = '❌ Không thể mở camera! Hãy kiểm tra quyền truy cập.';
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.frameTimer) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
    }
  }

  async captureFrame() {
    if (!this.selectedClassId || !this.selectedSubjectId) return; // Bắt buộc chọn lớp + môn
    if (!this.videoElement || this.videoElement.readyState < 2) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320;
    tempCanvas.height = 240;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(this.videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

    const blob: Blob = await new Promise((resolve) =>
      tempCanvas.toBlob((b) => resolve(b!), 'image/jpeg')
    );

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');
    formData.append('class_id', String(this.selectedClassId));
    formData.append('subject_id', String(this.selectedSubjectId));

    try {
      const res = await fetch('http://127.0.0.1:8000/api/recognize/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('📦 Dữ liệu trả về:', data);

      // Xóa khung cũ
      this.ctx.clearRect(0, 0, this.faceCanvas.width, this.faceCanvas.height);

      if (data.framed_image) {
        this.framedImage = data.framed_image;
        // clear any previous timeout
        if (this.framedImageTimeout) {
          clearTimeout(this.framedImageTimeout);
        }
        // remove the framed image after 5 seconds (change 5000 to adjust)
        this.framedImageTimeout = setTimeout(() => {
          this.framedImage = null;
          this.framedImageTimeout = null;
          // optionally clear canvas overlay when image removed
          if (this.ctx && this.faceCanvas) {
            this.ctx.clearRect(0, 0, this.faceCanvas.width, this.faceCanvas.height);
          }
        }, 5000);
      }

      if (data.box) {
        const scaleX = this.faceCanvas.width / 320;
        const scaleY = this.faceCanvas.height / 240;

        this.ctx.strokeStyle = data.success ? 'lime' : 'red';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
          data.box.left * scaleX,
          data.box.top * scaleY,
          (data.box.right - data.box.left) * scaleX,
          (data.box.bottom - data.box.top) * scaleY
        );
      }

      if (data.framed_image) {
        this.framedImage = data.framed_image;
      }

      if (data.success) {
        this.studentId = data.student_id;
        this.fullName = data.full_name;
        this.time = new Date().toLocaleString('vi-VN');
        this.message = data.message || '✅ Điểm danh thành công!';
        this.lastDetected = Date.now();
      } else {
        this.message = data.message || '❌ Không nhận diện được khuôn mặt!';
        this.fullName = '';
        this.studentId = '';
        this.time = '';
      }
    } catch (err) {
      console.error('Lỗi gửi dữ liệu:', err);
      this.message = 'Lỗi kết nối tới server!';
    }
  }
}

