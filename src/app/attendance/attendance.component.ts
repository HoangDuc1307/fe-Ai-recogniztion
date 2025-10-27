import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class AttendanceComponent implements OnInit, OnDestroy {
  videoElement!: HTMLVideoElement;
  stream: MediaStream | null = null;
  message = '';
  fullName = '';
  studentId = '';
  time = '';
  lastDetected = 0;

  ngOnInit() {
    this.startCamera();
    setInterval(() => this.captureFrame(), 15000);
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.videoElement = document.querySelector('video')!;
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = this.stream;
    } catch (err) {
      console.error('Lỗi mở camera:', err);
      this.message = 'Không thể mở camera!';
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
  }

  async captureFrame() {
    if (!this.videoElement || this.videoElement.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/jpeg')
    );

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/recognize/', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

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
