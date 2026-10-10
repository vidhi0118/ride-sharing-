import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SimpleAdminService } from '../services/simple-admin.service';

export const SimpleAdminGuard: CanActivateFn = () => {
  const adminService = inject(SimpleAdminService);
  const router = inject(Router);

  if (!adminService.isLoggedIn()) {
    router.navigate(['/admin-login']);
    return false;
  }

  return true;
};
