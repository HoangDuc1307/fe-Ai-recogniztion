import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as faceapi from 'face-api.js';

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
  framedImage: string | null = null;
  modelsLoaded = false;

  async ngOnInit() {
    await this.loadModels();
    await this.startCamera();

    // Chụp mỗi 10s nếu phát hiện có khuôn mặt
    setInterval(() => this.captureFrame(), 10000);
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async loadModels() {
    try {
      const MODEL_URL = '/models';
      await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)]);
      this.modelsLoaded = true;
    } catch (err) {
      console.error('❌ Lỗi tải mô hình:', err);
    }
  }

  async startCamera() {
    try {
      this.videoElement = document.querySelector('video')!;
      const overlay = document.getElementById('overlay') as HTMLCanvasElement;

      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = this.stream;
    } catch (err) {
      console.error('❌ Lỗi mở camera:', err);
      this.message = '❌ Không thể mở camera!';
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
  }

  async captureFrame() {
    if (!this.videoElement || this.videoElement.readyState < 2 || !this.modelsLoaded) return;

    const detection = await faceapi.detectSingleFace(
      this.videoElement,
      new faceapi.TinyFaceDetectorOptions()
    );

    if (!detection) {
      this.message = 'Không phát hiện khuôn mặt trong khung hình';
      return;
    } else {
      this.message = '';
    }

    // Chụp ảnh và gửi về backend
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx2 = canvas.getContext('2d');
    if (!ctx2) return;
    ctx2.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

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

      if (data.framed_image) this.framedImage = data.framed_image;

      if (data.success) {
        this.studentId = data.student_id;
        this.fullName = data.full_name;
        this.time = new Date().toLocaleString('vi-VN');
        this.message = data.message || '✅ Điểm danh thành công!';
      } else {
        this.message = data.message || '❌ Không nhận diện được khuôn mặt!';
        this.fullName = '';
        this.studentId = '';
        this.time = '';
      }
    } catch (err) {
      console.error('Lỗi gửi dữ liệu:', err);
      this.message = '❌ Lỗi kết nối tới server!';
    }
  }
}
