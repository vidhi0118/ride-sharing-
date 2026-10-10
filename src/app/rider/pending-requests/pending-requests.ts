import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from '../../firebase/firebase.config';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-requests.html',
  styleUrls: ['./pending-requests.css']
})
export class PendingRequestsComponent implements OnInit {

  requests: any[] = [];

  ngOnInit() {

    const q = query(
      collection(db, 'ride_requests'),
      where('status', '==', 'pending')
    );

    // 🔥 REAL-TIME LISTENER
    onSnapshot(q, snapshot => {

      // ✅ 1. Load pending requests
      this.requests = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // ⏰ 2. AUTO-EXPIRE LOGIC (10 minutes)
      const now = Date.now();

      this.requests.forEach(async r => {
        if (!r.requestedAt) return;

        const expiry =
          r.requestedAt.toMillis() + 10 * 60 * 1000;

        if (r.status === 'pending' && now > expiry) {
          await updateDoc(
            doc(db, 'ride_requests', r.id),
            { status: 'expired' }
          );
        }
      });
    });
  }

  // ✅ ACCEPT REQUEST
  async accept(r: any) {

  try {

    // Update request status
    await updateDoc(doc(db, 'ride_requests', r.id), {
      status: 'accepted'
    });

    // Send email
    fetch('http://localhost:5000/api/notifications/ride-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passengerEmail: r.passengerEmail,
        data: {
          status: 'accepted',
          from: r.from,
          to: r.to,
          rideDate: r.rideDate,
          rideTime: r.rideTime
        }
      })
    });

    this.requests = this.requests.filter(x => x.id !== r.id);

  } catch (error) {
    console.error(error);
    alert("Error accepting ride");
  }
}

  // ❌ REJECT REQUEST
  async reject(r: any) {

    await deleteDoc(doc(db, 'ride_requests', r.id));

    // 📧 Email passenger (REJECTED)
    fetch('http://localhost:5000/api/notifications/ride-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passengerEmail: r.passengerEmail,
        data: {
          status: 'rejected',
          from: r.from,
          to: r.to,
          rideDate: r.rideDate,
          rideTime: r.rideTime
        }
      })
    });

    this.requests = this.requests.filter(x => x.id !== r.id);
  }
}
