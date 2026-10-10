import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimpleAdminService } from '../../services/simple-admin.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [FormsModule , CommonModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.css']
})
export class AdminLoginComponent {

  username = '';
  password = '';
  error = '';

  constructor(
    private adminService: SimpleAdminService,
    private router: Router
  ) {}

  login() {
    const success = this.adminService.login(this.username, this.password);

    if (success) {
      this.router.navigate(['/admin']);
    } else {
      this.error = 'Invalid admin credentials';
    }
  }
}
