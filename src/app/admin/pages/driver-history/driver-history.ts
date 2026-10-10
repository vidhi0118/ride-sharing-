import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-history.html',
  styleUrls: ['./driver-history.css']
})
export class DriverHistory implements OnInit {

  rides: any[] = [];

  // 🔥 TEMP: replace with actual driverId
  driverId = history.state?.driverId || '';

  async ngOnInit() {

    const snap = await getDocs(collection(db, 'ride_requests'));

    this.rides = snap.docs
      .map(d => {
        const data: any = d.data();

        // ✅ only this driver's rides
        if (data.driverId !== this.driverId) return null;

        return {
          from: data.from,
          to: data.to,
          fare: data.payableAmount || data.fare || 0,
          status: data.status,
          rating: data.rating || '-',
          date: this.formatTime(data.createdAt)
        };
      })
      .filter(r => r !== null);

    // 🔥 latest first
    this.rides.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  formatTime(ts: any) {
    if (!ts?.seconds) return '-';
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  short(loc: string) {
    return loc?.split(',')[0];
  }
}
