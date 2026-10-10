import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PassengerNavbarComponent } from '../passenger-navbar/passenger-navbar';

import { db, auth } from './../../firebase/firebase.config';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

import { MatIconModule } from '@angular/material/icon';

/* ✅ ADD THIS */
import * as L from 'leaflet';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [CommonModule, PassengerNavbarComponent, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class PassengerDashboardComponent implements OnInit, AfterViewInit {

  activeRide: any = null;

  totalRides = 0;
  totalSpent = 0;
  totalRefund = 0;

  /* ✅ ADD MAP VARIABLE */
  map!: L.Map;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadRealTimeRide();
    this.loadStats();
  }

  /* ✅ INIT MAP AFTER VIEW LOAD */
  ngAfterViewInit(): void {
    this.initMap();
  }

  /* ✅ MAP INIT */
  initMap() {
    this.map = L.map('map').setView([23.0225, 72.5714], 13); // Ahmedabad

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  /* 🔥 REAL-TIME RIDE */
  loadRealTimeRide() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'ride_requests'),
      where('passengerId', '==', user.uid)
    );

    onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => doc.data());

      const active = rides.find(r =>
        r['status'] === 'accepted' || r['status'] === 'ongoing'
      );

      this.activeRide = active || null;
    });
  }

  /* 📊 STATS */
  loadStats() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'ride_requests'),
      where('passengerId', '==', user.uid)
    );

    onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => doc.data());

      this.totalRides = rides.length;

      this.totalSpent = rides
        .filter(r => r['paymentStatus'] === 'paid')
        .reduce((sum, r) => sum + (r['fare'] || 0), 0);

      this.totalRefund = rides
        .filter(r => r['paymentStatus'] === 'refunded')
        .reduce((sum, r) => sum + (r['fare'] || 0), 0);
    });
  }

  /* 📍 GET USER LOCATION */
  getPassengerLocation() {
    navigator.geolocation.getCurrentPosition((position) => {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.map.setView([lat, lng], 13);

      L.marker([lat, lng])
        .addTo(this.map)
        .bindPopup("📍 You are here")
        .openPopup();

    });
  }

  /* NAVIGATION */
  goToMyBookings() {
    this.router.navigate(['/passenger/my-bookings']);
  }

  goMyRequests() {
    this.router.navigate(['/passenger/my-requests']);
  }

  goToTrackRide() {
    this.router.navigate(['/passenger/track-ride']);
  }

  goToViewDrivers() {
    this.router.navigate(['/passenger/view-drivers']);
  }

  goToPayments() {
    this.router.navigate(['/passenger/passenger-payments']);
  }
}
