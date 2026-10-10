import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  name = '';
  email = '';
  phone = '';
  password = '';
  role: 'passenger' | 'driver' = 'passenger';

  aadhaar = '';
  aadhaarError = false;
  aadhaarVerified = false;
  verifying = false;
  loading = false;

  nameError = '';
  phoneError = '';
  passwordError = '';

  successMessage = '';
  isRegistered = false;

  showPassword = false;
  generalError = '';

  selectedFile!: File;
photoError = '';
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /* ================= VALIDATIONS ================= */

  validateName() {
    const nameRegex = /^[A-Za-z ]+$/;
    if (!this.name.trim()) {
      this.nameError = 'Name is required';
    } else if (!nameRegex.test(this.name)) {
      this.nameError = 'Name must contain only letters';
    } else {
      this.nameError = '';
    }
  }

  validatePhone() {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!this.phone.trim()) {
      this.phoneError = 'Phone number is required';
    } else if (!phoneRegex.test(this.phone)) {
      this.phoneError = 'Enter valid 10-digit mobile number';
    } else {
      this.phoneError = '';
    }
  }

  validatePassword() {
    if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
    } else {
      this.passwordError = '';
    }
  }

  clearGeneralError() {
  this.generalError = '';
}

  /* ================= PASSWORD TOGGLE ================= */

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /* ================= AADHAAR ================= */

  onAadhaarInput(event: any) {
    this.aadhaar = this.aadhaar.replace(/\D/g, '');
    if (this.aadhaar.length > 12) {
      this.aadhaar = this.aadhaar.slice(0, 12);
    }
    this.aadhaarError = false;
    this.aadhaarVerified = false;
  }

  verifyAadhaar() {
    if (this.aadhaar.length !== 12) {
      this.aadhaarError = true;
      return;
    }

    this.verifying = true;

    setTimeout(() => {
      this.verifying = false;
      this.aadhaarVerified = true;
    }, 2000);
  }

  onFileSelected(event: any) {
  const file = event.target.files[0];

  if (!file) return;

  // Only allow images
  if (!file.type.startsWith('image/')) {
    this.photoError = 'Only image files are allowed';
    return;
  }

  // Max size 2MB
  if (file.size > 2 * 1024 * 1024) {
    this.photoError = 'Image must be less than 2MB';
    return;
  }

  this.photoError = '';
  this.selectedFile = file;
}
  /* ================= NAVIGATION ================= */

  goToLogin() {
    this.router.navigate(['/login']);
  }

  /* ================= REGISTER ================= */

  canRegister(): boolean {
    return (
      !this.nameError &&
      !this.phoneError &&
      !this.passwordError &&
      !!(
        this.name &&
        this.email &&
        this.phone &&
        this.password &&
        this.aadhaarVerified
      )
    );
  }

  async register() {
    this.validateName();
    this.validatePhone();
    this.validatePassword();

    if (!this.canRegister()) return;

    this.loading = true;

    try {
      await this.authService.register(
        this.name,
        this.email,
        this.password,
        this.phone,
        this.role,
        true
      );

      const formData = new FormData();
formData.append('name', this.name);
formData.append('email', this.email);
formData.append('role', this.role);

if (this.selectedFile) {
  formData.append('photo', this.selectedFile);
}

fetch('http://localhost:5000/api/auth/register-with-photo', {
  method: 'POST',
  body: formData
}).catch(() => {});

      this.isRegistered = true;
      this.successMessage =
        '🎉 Registration successful! Please verify your email to continue.';

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);

    } catch (err: any) {

  // Firebase duplicate email error
  if (err.code === 'auth/email-already-in-use') {
    this.generalError = 'This email is already registered. Please login instead.';
  } else {
    this.generalError = 'Registration failed. Please try again.';
  }

}


    this.loading = false;
  }
}
