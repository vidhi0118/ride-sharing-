import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

import { db, auth } from './../../firebase/firebase.config';
import { PassengerNavbarComponent } from '../passenger-navbar/passenger-navbar';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, PassengerNavbarComponent],
  templateUrl: './my-bookings.html',
  styleUrls: ['./my-bookings.css']
})
export class MyBookings implements OnInit {

  rides: any[] = [];
  loading = true;

  stars = [1,2,3,4,5];

  async ngOnInit() {
    await this.loadRideHistory();
  }

  async loadRideHistory() {

    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'ride_requests'),
      where('passengerId', '==', user.uid)
    );

    const snapshot = await getDocs(q);

    this.rides = [];

    for (const docSnap of snapshot.docs) {

      const data: any = {
        id: docSnap.id,
        ...docSnap.data()
      };

      // 🔥 FETCH DRIVER FROM USERS
      if (data.driverId) {
        const driverSnap = await getDoc(doc(db, 'users', data.driverId));

        if (driverSnap.exists()) {
          data.driver = driverSnap.data();
        }
      }

      this.rides.push(data);
    }

    // sort latest first
    this.rides.sort((a, b) =>
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    this.loading = false;
  }

  // 📍 clean location
  getShortLocation(address: string): string {
    if (!address) return 'Unknown';
    return address.split(',')[0];
  }

  // 🖼️ driver image
  getDriverPhoto(r: any) {
    return r.driver?.photoUrl || 'assets/user.png';
  }

  // ⭐ rating submit
  submitRating(r: any, rating: number) {

    if (r.rating) {
      alert("Already rated");
      return;
    }

    updateDoc(doc(db, 'ride_requests', r.id), {
      rating: rating,
      ratedAt: new Date()
    }).then(() => {

      alert("Rating submitted ⭐");

      r.rating = rating;

    }).catch((err: any) => {
      console.error(err);
    });
  }

  // 🎨 status
  getStatusClass(status: string) {
    return 'status ' + status;
  }

  // 🕒 format time
  formatTime(ts: any) {
    if (!ts) return '-';
    return new Date(ts.seconds * 1000).toLocaleString();
  }

  // 🚗 track
  trackRide(r: any) {
    history.pushState({ ride: r }, '', '/passenger/live-track');
    window.location.href = '/passenger/live-track';
  }

  async cancelBooking(r: any) {

  const confirmCancel = confirm("Are you sure you want to cancel this ride?");
  if (!confirmCancel) return;

  const now = new Date();

  // 🔥 combine date + time properly
  const rideDateTime = new Date(`${r.fromDate} ${r.rideTime}`);

  const diffHours = (rideDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let penalty = 0;

  if (diffHours < 6) {
    penalty = 100;
  } else if (diffHours < 24) {
    penalty = 50;
  } else {
    penalty = 0;
  }

  await updateDoc(doc(db, 'ride_requests', r.id), {
    status: 'cancelled',
    cancelledAt: new Date(),
    penalty: penalty
  });

  alert(`Ride cancelled ❌\nPenalty: ₹${penalty}`);

  this.loadRideHistory(); // refresh
}
//  format ride date + time
formatRideDate(r: any) {
  if (!r.rideDate || !r.rideTime) return '-';

  const dt = new Date(`${r.rideDate} ${r.rideTime}`);
  return dt.toLocaleString();
}
}
