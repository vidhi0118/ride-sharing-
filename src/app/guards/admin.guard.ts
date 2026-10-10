import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.getCurrentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const role = await authService.getUserRole(user.uid);

  if (role !== 'admin') {
    router.navigate(['/']);
    return false;
  }

  return true;
};
