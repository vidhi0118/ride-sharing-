import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rides.html',
  styleUrls: ['./rides.css']
})
export class Rides implements OnInit {

  rides: any[] = [];
  filteredRides: any[] = [];

  usersMap: Map<string, any> = new Map();

  searchText = '';
  selectedStatus = 'all';

  async ngOnInit() {

    // 🔹 LOAD USERS
    const userSnap = await getDocs(collection(db, 'users'));
    userSnap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      this.usersMap.set(d.id, d.data());
    });

    // 🔹 LOAD RIDE REQUESTS (MAIN DATA)
    const snap = await getDocs(collection(db, 'ride_requests'));

    this.rides = snap.docs.map(d => {

      const data: any = d.data();

      const driver = data.driverId
        ? this.usersMap.get(data.driverId)
        : null;

      const passenger = data.passengerId
        ? this.usersMap.get(data.passengerId)
        : null;

      return {
        id: d.id,

        from: data.from,
        to: data.to,
        price: data.fare || data.payableAmount || 0,

        // ✅ IMPORTANT FOR SORTING
        createdAt: data.createdAt,

        date: this.formatTime(data.createdAt),
        time: this.formatTime(data.createdAt),

        status: data.status,
        paymentStatus: data.paymentStatus,
        penalty: data.penalty || 0,

        driverName: driver?.name || 'Unknown',

        // ✅ DRIVER IMAGE FIX
        driverPhoto: driver?.photoUrl && driver.photoUrl !== ''
          ? driver.photoUrl
          : 'assets/user.png',

        passengerName: passenger?.name || 'Unknown',

        mapLink: `https://www.google.com/maps?q=${encodeURIComponent(data.from)}`
      };
    });

    // 🔥 SORT (LATEST FIRST)
    this.rides.sort((a: any, b: any) => {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    this.filteredRides = [...this.rides];
  }

  /* 🔍 FILTER + SEARCH */
  applyFilters() {

    const search = this.searchText.toLowerCase();

    this.filteredRides = this.rides.filter(r => {

      const matchSearch =
        r.from?.toLowerCase().includes(search) ||
        r.to?.toLowerCase().includes(search) ||
        r.driverName?.toLowerCase().includes(search);

      const matchStatus =
        this.selectedStatus === 'all' ||
        r.status === this.selectedStatus ||
        (this.selectedStatus === 'paid' && r.paymentStatus === 'paid');

      return matchSearch && matchStatus;
    });
  }

  /* 🕒 FORMAT TIME */
  formatTime(ts: any) {
    if (!ts?.seconds) return '-';
    return new Date(ts.seconds * 1000).toLocaleString();
  }

  /* 📍 SHORT LOCATION */
  short(loc: string) {
    return loc?.split(',')[0];
  }

  /* 📄 EXPORT CSV */
  exportCSV() {
    let csv = 'From,To,Driver,Passenger,Price,Status,Payment\n';

    this.filteredRides.forEach(r => {
      csv += `${r.from},${r.to},${r.driverName},${r.passengerName},${r.price},${r.status},${r.paymentStatus}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'rides-report.csv';
    a.click();
  }
}
