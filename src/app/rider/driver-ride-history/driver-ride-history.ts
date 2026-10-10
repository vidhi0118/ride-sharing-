import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

@Component({
  selector: 'app-driver-ride-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-ride-history.html',
  styleUrls: ['./driver-ride-history.css']
})
export class DriverRideHistoryComponent implements OnChanges {

  @Input() driverId!: string;

  rides: any[] = [];
  db = getFirestore();

  formatTime(ts: any) {
    if (!ts?.seconds) return '-';
    return new Date(ts.seconds * 1000).toLocaleString();
  }

  async ngOnChanges() {

    if (!this.driverId) return;

    const q = query(
      collection(this.db, 'ride_requests'), // ✅ FIXED (IMPORTANT)
      where('driverId', '==', this.driverId)
    );

    const snapshot = await getDocs(q);

    this.rides = snapshot.docs.map(doc => {

      const data: any = doc.data();

      const fare = data.fare || data.payableAmount || 0;

      return {
        ...data,
        fare: fare,

        // ✅ FIXED EARNING LOGIC
        earning:
          data.status === 'cancelled'
            ? (data.penalty || 0)
            : (data.driverAmount || fare)
      };
    });

    console.log("Rides:", this.rides);
  }
}
