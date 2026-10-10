import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc, updateDoc
} from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase.config';
@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-requests.html',
  styleUrls: ['./my-requests.css']
})
export class MyRequestsComponent implements OnInit {

  requests: any[] = [];
  private expiredShown: Set<string> = new Set(); // prevent repeated alerts

  ngOnInit() {

    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'ride_requests'),
      where('passengerId', '==', user.uid),
      orderBy('createdAt', 'desc')   // 🔥 newest first
    );

    onSnapshot(q, snapshot => {

      this.requests = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // 🔔 Detect expired in real-time
      this.requests.forEach(r => {
        if (r.status === 'expired' && !this.expiredShown.has(r.id)) {

          alert("Driver did not respond to your request. Please find another driver.");

          this.expiredShown.add(r.id);
        }
      });

    });

  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // amber
      case 'accepted':
        return '#16a34a'; // green
      case 'rejected':
        return '#dc2626'; // red
      case 'expired':
        return '#6b7280'; // gray
      default:
        return '#000000';
    }
  }
  async cancelRequest(r: any) {

  const confirmCancel = confirm("Are you sure you want to cancel this request?");
  if (!confirmCancel) return;

  await updateDoc(doc(db, 'ride_requests', r.id), {
    status: 'cancelled',
    cancelledAt: new Date(),
    penalty: 0
  });

  alert("Request cancelled successfully ❌");
}
}
