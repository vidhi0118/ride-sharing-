import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';

import { db, auth } from '../../firebase/firebase.config';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class NotificationsComponent implements OnInit {

  notifications: any[] = [];
  role: string | null = null;
  userId: string | null = null;

  showToast = false;
  toastMessage = '';
  previousCount = 0;

  audio = new Audio('assets/notification.mp3');

  constructor(private authService: AuthService) {}

  async ngOnInit() {

    const user = auth.currentUser;
    if (!user) return;

    this.userId = user.uid;
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
      orderBy('createdAt', 'desc')
    );

    onSnapshot(q, snapshot => {

      const newCount = snapshot.size;

      if (newCount > this.previousCount) {
        this.triggerToast('New notification received');
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }

      this.notifications = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      this.previousCount = newCount;
    });

    this.markAllAsRead();
  }

  async markAllAsRead() {
    if (!this.userId || !this.role) return;

    const unreadQuery = query(
      collection(db, 'notifications'),
      where(
        this.role === 'driver'
          ? 'driverId'
          : 'passengerId',
        '==',
        this.userId
      ),
      where('read', '==', false)
    );

    const snapshot = await getDocs(unreadQuery);

    snapshot.forEach(async docSnap => {
      await updateDoc(doc(db, 'notifications', docSnap.id), {
        read: true
      });
    });
  }

  async deleteNotification(id: string) {
    await deleteDoc(doc(db, 'notifications', id));
  }

  async clearAll() {
    for (let n of this.notifications) {
      await deleteDoc(doc(db, 'notifications', n.id));
    }
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'accepted': return '#16a34a';
      case 'rejected': return '#dc2626';
      case 'expired': return '#f59e0b';
      default: return '#3b82f6';
    }
  }
}
