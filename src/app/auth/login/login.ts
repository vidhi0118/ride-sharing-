import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  showPassword = false;
  togglePassword() {
  this.showPassword = !this.showPassword;
}

  goHome() {
  this.router.navigate(['/']);
}


  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

async login() {
  if (!this.email || !this.password) {
    alert("Please enter email and password");
    return;
  }

  this.loading = true;

  try {
    const cred = await this.authService.login(this.email, this.password);
    const uid = cred.user.uid;

    const role = await this.authService.getUserRole(uid);

    if (role === 'driver') {
      this.router.navigate(['/dashboard']);
    } else if (role === 'passenger') {
      this.router.navigate(['/passenger/dashboard']);
    } else {
      this.router.navigate(['/admin']);
    }

  } catch (error) {
    alert("Invalid email or password");
  } finally {
    this.loading = false;
  }
}

forgotPassword() {
  if (!this.email) {
    alert("Enter email first");
    return;
  }

  localStorage.setItem('otp_email', this.email);

  this.router.navigate(['/verify-otp']);
}
}
