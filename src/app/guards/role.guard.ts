import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const RoleGuard = (
  expectedRole: 'passenger' | 'driver'
): CanActivateFn => {

  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = await authService.getCurrentUser();

    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const role = await authService.getUserRole(user.uid);

    // ✅ Allow correct role
    if (role === expectedRole) {
      return true;
    }

    // 🔀 Redirect to OWN dashboard
    if (role === 'passenger') {
      router.navigate(['/passenger/dashboard']);
    }
    else if (role === 'driver') {
      router.navigate(['/dashboard']);
    }
    else if (role === 'admin') {
      router.navigate(['/admin']);
    }
    else {
      router.navigate(['/login']);
    }

    return false;
  };
};
