import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { auth } from '../firebase/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return new Promise<boolean>((resolve) => {

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 🔐 User is logged in
        resolve(true);
      } else {
        // 🚫 Not logged in
        router.navigate(['/login']);
        resolve(false);
      }
    });

  });
};
