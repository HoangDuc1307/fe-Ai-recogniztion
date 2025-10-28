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
  faceCanvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  stream: MediaStream | null = null;

  message = '';
  fullName = '';
  studentId = '';
  time = '';
  lastDetected = 0;
  framedImage : string | null=null;
  framedImageTimeout: any = null;


  ngOnInit() {
    this.startCamera();
    setInterval(() => this.captureFrame(), 10000);
  }

  ngOnDestroy() {
    this.stopCamera();
    if (this.framedImageTimeout) {
      clearTimeout(this.framedImageTimeout);
      this.framedImageTimeout = null;
    }
  }

  async startCamera() {
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
    } catch (err) {
      console.error('Lỗi mở camera:', err);
      this.message = '❌ Không thể mở camera! Hãy kiểm tra quyền truy cập.';
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
  }

  async captureFrame() {
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
