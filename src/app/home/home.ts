import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { auth, db } from './../firebase/firebase.config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  isLoggedIn = false;
  userName = '';
  drivers: any[] = [];
  map: any;

  constructor(private router: Router) {}

  ngOnInit() {

    // Auth
    onAuthStateChanged(auth, (user) => {
      this.isLoggedIn = !!user;
      this.userName = user?.email || '';
    });

    // Drivers from Firestore
    const ref = collection(db, 'users');

    onSnapshot(ref, (snapshot) => {
      this.drivers = [];

      snapshot.forEach(doc => {
        const d: any = doc.data();

        if (d.role === 'driver') {

          // ⭐ CALCULATE RATING
          let avgRating = 0;
          let count = 0;

          if (d.rating) {
            avgRating = d.rating;
            count = d.ratingCount || 0;
          } else if (d.ratings) {
            count = d.ratings.length;
            avgRating =
              count > 0
                ? d.ratings.reduce((a: any, b: any) => a + b.rating, 0) / count
                : 0;
          }

          d.avgRating = avgRating.toFixed(1);
          d.ratingCount = count;

          this.drivers.push(d);

          // Add marker
          if (this.map) {
            L.marker([d.lat, d.lng])
              .addTo(this.map)
              .bindPopup(`
                <b>${d.name}</b><br>
                ${d.defaultVehicle}<br>
                ⭐ ${d.avgRating} (${d.ratingCount})
              `);
          }
        }
      });
    });
  }

  goToRegister() {
  this.router.navigate(['/register']);
}

goToLogin() {
  this.router.navigate(['/login']);
}

goToMap() {
  this.router.navigate(['/map']);
}
  ngAfterViewInit(): void {

    this.map = L.map('map').setView([20.59, 78.96], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Fix marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
    });
  }

  goToDrivers() {
    this.router.navigate(['/passenger/view-drivers']);
  }

  logout() {
    signOut(auth);
  }

  viewDriver(d: any) {
    console.log(d);
  }
}
