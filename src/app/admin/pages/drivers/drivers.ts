import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';
import { Router } from '@angular/router';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drivers.html',
  styleUrls: ['./drivers.css']
})
export class Drivers implements OnInit {
constructor(private router: Router) {}
  drivers: any[] = [];
  filteredDrivers: any[] = [];
  topDrivers: any[] = [];

  searchText = '';

  COMMISSION = 0.1;

  async ngOnInit() {

    const userSnap = await getDocs(collection(db, 'users'));
    const rideSnap = await getDocs(collection(db, 'ride_requests'));

    const rideList: any[] = rideSnap.docs.map(d => d.data());

    this.drivers = userSnap.docs
      .map(d => {

        const data: any = d.data();

        if (data.role !== 'driver') return null;

        // ✅ COMPLETED RIDES
        const driverRides = rideList.filter(r =>
          r['driverId'] === d.id && r['status'] === 'completed'
        );

        const totalRides = driverRides.length;

        // 💰 EARNINGS (FIXED)
        let earnings = 0;

        driverRides.forEach(r => {
          const fare = r['payableAmount'] || r['fare'] || 0;
          const driverShare = fare - (fare * this.COMMISSION);
          earnings += driverShare;
        });

        // ⭐ RATING
        const ratedRides = rideList.filter(r =>
          r['driverId'] === d.id && r['rating']
        );

        let avgRating: any = 'N/A';

        if (ratedRides.length > 0) {
          const total = ratedRides.reduce((sum, r) => sum + (r['rating'] || 0), 0);
          avgRating = (total / ratedRides.length).toFixed(1);
        }

        return {
          id: d.id,
          name: data.name,
          email: data.email,
          vehicle: data.defaultVehicle || 'N/A',
          city: data.city || 'N/A',
          photo: data.photoUrl || 'assets/user.png',

          totalRides,
          earnings: Math.round(earnings),
          rating: avgRating,

          blocked: data.blocked || false
        };

      })
      .filter(d => d !== null);

    // 🔥 TOP DRIVERS (by rides)
    this.topDrivers = [...this.drivers]
      .sort((a, b) => b.totalRides - a.totalRides)
      .slice(0, 5);

    this.filteredDrivers = [...this.drivers];
  }

  /* 🔍 SEARCH */
  applySearch() {

    const search = this.searchText.toLowerCase();

    this.filteredDrivers = this.drivers.filter(d =>
      d.name?.toLowerCase().includes(search) ||
      d.email?.toLowerCase().includes(search) ||
      d.city?.toLowerCase().includes(search)
    );
  }

  /* 🚫 BLOCK / UNBLOCK */
  async toggleBlock(driver: any) {

    const newStatus = !driver.blocked;

    await updateDoc(doc(db, 'users', driver.id), {
      blocked: newStatus
    });

    driver.blocked = newStatus;
  }
  viewHistory(driver: any) {
  this.router.navigate(['/admin/driver-history'], {
    state: { driverId: driver.id }
  });
}
}
