import { firebaseApp } from './../../firebase/firebase.config';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './../../firebase/firebase.config';
import { PassengerNavbarComponent } from '../passenger-navbar/passenger-navbar';

@Component({
  selector: 'app-ride-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PassengerNavbarComponent],
  templateUrl: './ride-list.html',
  styleUrls: ['./ride-list.css']
})
export class RideListComponent implements OnInit {

  rides: any[] = [];
  filteredRides: any[] = [];

  from = '';
  to = '';
  date = '';

  loading = true;
  bookingRideId: string | null = null;
  bookedRideIds = new Set<string>();

  async ngOnInit() {
    await this.loadMyBookings();
    await this.loadRidesWithDrivers();
  }

  // ✅ Expiry logic (only for one-time rides)
  isRideExpired(ride: any): boolean {

    if (ride.rideType !== 'one-time') {
      return false; // recurring rides don't expire automatically
    }

    if (!ride.date || !ride.startTime) {
      return false;
    }

    const dateTime = new Date(`${ride.date} ${ride.startTime}`);
    return dateTime < new Date();
  }

  // ✅ Simplified sorting (no expired logic needed now)
  sortRides(rides: any[]): any[] {
    return rides.sort((a, b) => {

      if (a.rideType !== b.rideType) {
        if (a.rideType === 'one-time') return -1;
        if (b.rideType === 'one-time') return 1;
      }

      const timeA = new Date(`${a.date} ${a.startTime || '00:00'}`).getTime();
      const timeB = new Date(`${b.date} ${b.startTime || '00:00'}`).getTime();

      return timeA - timeB;
    });
  }

  async loadRidesWithDrivers() {
    this.loading = true;
    this.rides = [];

    const snapshot = await getDocs(collection(db, 'rides'));

    for (const rideDoc of snapshot.docs) {
      const rideData: any = {
        id: rideDoc.id,
        ...rideDoc.data()
      };

      const expired = this.isRideExpired(rideData);

      // ✅ Completely remove expired rides
      if (expired) {
        continue;
      }

      if (rideData.driverId) {
        const driverSnap = await getDoc(doc(db, 'users', rideData.driverId));

        rideData.driverName = driverSnap.exists()
          ? driverSnap.data()['name']
          : 'Unknown Driver';

        rideData.driverRating = driverSnap.exists()
          ? driverSnap.data()['rating'] ?? 4.0
          : 4.0;

        rideData.driverEmail = driverSnap.exists()
          ? driverSnap.data()['email']
          : '';
      }

      this.rides.push(rideData);
    }

    this.filteredRides = this.sortRides([...this.rides]);
    this.loading = false;
  }

  async loadMyBookings() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('passengerId', '==', user.uid),
      where('status', '==', 'booked')
    );

    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => {
      this.bookedRideIds.add(docSnap.data()['rideId']);
    });
  }

  applyFilters() {
    const filtered = this.rides.filter(ride => {

      const matchFrom =
        !this.from ||
        ride.from?.toLowerCase().includes(this.from.toLowerCase());

      const matchTo =
        !this.to ||
        ride.to?.toLowerCase().includes(this.to.toLowerCase());

      const matchDate =
        !this.date ||
        ride.rideType !== 'one-time' ||
        ride.date === this.date;

      return matchFrom && matchTo && matchDate;
    });

    this.filteredRides = this.sortRides(filtered);
  }

  clearFilters() {
    this.from = '';
    this.to = '';
    this.date = '';
    this.filteredRides = this.sortRides([...this.rides]);
  }

  async bookRide(ride: any) {
    const user = auth.currentUser;
    if (!user) {
      alert('Please login');
      return;
    }

    if (ride.availableSeats <= 0) {
      alert('No seats available');
      return;
    }

    if (this.bookedRideIds.has(ride.id)) {
      alert('Request already sent');
      return;
    }

    this.bookingRideId = ride.id;

    await addDoc(collection(db, 'ride_requests'), {
      rideId: ride.id,
      driverId: ride.driverId,
      passengerId: user.uid,
      passengerName: user.displayName || 'Passenger',
      passengerEmail: user.email || '',
      from: ride.from,
      to: ride.to,
      rideDate: ride.date || '',
      rideTime: ride.startTime || '',
      status: 'pending',
      requestedAt: Timestamp.now()
    });

    await addDoc(collection(db, 'notifications'), {
      driverId: ride.driverId,
      type: 'RIDE_REQUEST',
      message: `${user.displayName || 'Passenger'} requested to book your ride ${ride.from} → ${ride.to}`,
      createdAt: Timestamp.now(),
      read: false
    });

    this.bookedRideIds.add(ride.id);
    this.bookingRideId = null;

    alert('Ride request sent! Waiting for driver confirmation.');
  }
}
