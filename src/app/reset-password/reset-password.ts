import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent {

  password = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  async resetPassword() {
    if (!this.password || !this.confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const email = localStorage.getItem('otp_email');

    if (!email) {
      alert("Session expired");
      return;
    }

    this.loading = true;

    try {
      await this.http.post(
        'http://localhost:5000/api/auth/reset-password',
        { email, password: this.password }
      ).toPromise();

      alert("Password reset successful ✅");

      localStorage.removeItem('otp_email');

      this.router.navigate(['/login']);

    } catch (err) {
      alert("Failed to reset password");
    } finally {
      this.loading = false;
    }
  }
}
