import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { SimpleAdminService } from '../services/simple-admin.service';

@Component({
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin {
  constructor(
    private adminService: SimpleAdminService,
    private router: Router
  ) {}

  logout() {
    this.adminService.logout();
    this.router.navigate(['/admin-login']);
  }
}
