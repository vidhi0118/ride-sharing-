import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SimpleAdminService {

  private isAdminLoggedIn = false;

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin123') {
      this.isAdminLoggedIn = true;
      return true;
    }
    return false;
  }

  logout() {
    this.isAdminLoggedIn = false;
  }

  isLoggedIn(): boolean {
    return this.isAdminLoggedIn;
  }
}
