import { auth, db } from '../../firebase/firebase.config';
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';

import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-passenger-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './passenger-navbar.html',
  styleUrls: ['./passenger-navbar.css']
})
export class PassengerNavbarComponent implements OnInit {

  unreadCount = 0;
  previousCount = 0;
  isShaking = false;
  role: string | null = null;

  constructor(
    private location: Location,
    private router: Router,
    private authService: AuthService
  ) {}

  async ngOnInit() {

    const user = auth.currentUser;
    if (!user) return;

    this.role = await this.authService.getUserRole(user.uid);

    const q = query(
      collection(db, 'notifications'),
      where(
        this.role === 'driver'
          ? 'driverId'
          : 'passengerId',
        '==',
        user.uid
      ),
      where('read', '==', false)
    );

    onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {

      const newCount = snapshot.size;

      if (newCount > this.previousCount) {
        this.triggerShake();
      }

      this.unreadCount = newCount;
      this.previousCount = newCount;
    });
  }

  triggerShake() {
    this.isShaking = true;
    setTimeout(() => {
      this.isShaking = false;
    }, 600);
  }

  goToNotifications() {
    if (this.role === 'driver') {
      this.router.navigate(['/notifications']);
    } else {
      this.router.navigate(['/notifications']);
    }
  }

  goBack() {
    this.location.back();
  }

  goHome() {
    if (this.role === 'driver') {
      this.router.navigate(['/rider/dashboard']);
    } else {
      this.router.navigate(['/passenger/dashboard']);
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
