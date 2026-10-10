import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-otp.html',
  styleUrls: ['./verify-otp.css']
})
export class VerifyOtpComponent implements AfterViewInit, OnInit {

  otp = '';
  timer = 120;
  canResend = false;
  loading = false;
  shake = false;
  success = false;

  @ViewChild('hiddenOtpInput')
  hiddenOtpInput!: ElementRef<HTMLInputElement>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ✅ PAGE LOAD (only for forgot password)
  async ngOnInit() {
    this.startTimer();
    await this.sendOtp();
  }

  // ✅ AUTO FOCUS
  ngAfterViewInit() {
    this.focusOtpInput();
  }

  focusOtpInput() {
    this.hiddenOtpInput?.nativeElement.focus();
  }

  // ⏱ TIMER
  startTimer() {
    this.timer = 120;
    this.canResend = false;

    const interval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(interval);
        this.canResend = true;
      }
    }, 1000);
  }

  // 🔥 SEND OTP
  async sendOtp() {
    const email = localStorage.getItem('otp_email');

    if (!email) {
      console.log("❌ Email missing → redirecting");
      this.router.navigate(['/login']); // safety
      return;
    }

    try {
      await this.http.post(
        'http://localhost:5000/api/otp/send',
        { email }
      ).toPromise();

      console.log("✅ OTP Sent");

    } catch (err) {
      console.error("❌ OTP Send Failed", err);
    }
  }

  // 🔢 OTP INPUT
  onOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.otp = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = this.otp;

    if (this.otp.length === 6 && !this.loading) {
      this.verifyOtp();
    }
  }

  // ❌ SHAKE
  triggerShake() {
    this.shake = true;

    setTimeout(() => {
      this.shake = false;
      this.otp = '';
      this.hiddenOtpInput.nativeElement.value = '';
      this.focusOtpInput();
    }, 500);
  }

  // ✅ VERIFY OTP
  async verifyOtp() {
    if (this.otp.length !== 6) return;

    const email = localStorage.getItem('otp_email');

    if (!email) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;

    try {
      const res: any = await this.http.post(
        'http://localhost:5000/api/otp/verify',
        { email, otp: this.otp }
      ).toPromise();

      if (!res?.success) {
        this.triggerShake();
        return;
      }

      // ✅ SUCCESS
      this.success = true;

      setTimeout(() => {
        this.router.navigate(['/reset-password']); // ✅ correct flow
      }, 1000);

    } catch {
      this.triggerShake();
    } finally {
      this.loading = false;
    }
  }

  // 🔁 RESEND OTP
  async resendOtp() {
    const email = localStorage.getItem('otp_email');

    if (!email) return;

    await this.http.post(
      'http://localhost:5000/api/otp/send',
      { email }
    ).toPromise();

    this.otp = '';
    this.hiddenOtpInput.nativeElement.value = '';
    this.focusOtpInput();
    this.startTimer();
  }
}
