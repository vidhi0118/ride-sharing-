import { db } from './../../../firebase/firebase.config';
import { Component, OnInit } from '@angular/core';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Chart } from 'chart.js/auto';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  users = 0;
  rides = 0;
  bookings = 0;

  rideList: any[] = [];
  filteredRides: any[] = [];
  topDrivers: any[] = [];

  selectedFilter = 'all';

  revenueChart: any;
  dailyChart: any;
  userChart: any;
  pieChart: any;
  lineChart: any;

  async ngOnInit() {

    // 👥 USERS
    this.users = (await getDocs(collection(db, 'users'))).size;

    // 🚗 RIDES (FIXED COLLECTION)
    const snap = await getDocs(collection(db, 'ride_requests'));

    this.rides = snap.size;
    this.bookings = snap.size;

    this.rideList = snap.docs.map(doc => doc.data());

    this.applyFilter('all');
    await this.calculateTopDrivers();
  }

  /* ================= FILTER ================= */

  applyFilter(type: string) {

    this.selectedFilter = type;
    const now = new Date();

    if (type === 'today') {
      this.filteredRides = this.rideList.filter(r =>
        this.isSameDay(r, now)
      );
    }
    else if (type === 'week') {
      this.filteredRides = this.rideList.filter(r =>
        this.getDate(r) >= new Date(now.getTime() - 7 * 86400000)
      );
    }
    else if (type === 'month') {
      this.filteredRides = this.rideList.filter(r =>
        this.getDate(r) >= new Date(now.getTime() - 30 * 86400000)
      );
    }
    else {
      this.filteredRides = [...this.rideList];
    }

    this.buildCharts();
  }

  /* ================= DATE HELPERS ================= */

  getDate(r: any): Date {
    return r.createdAt?.seconds
      ? new Date(r.createdAt.seconds * 1000)
      : new Date();
  }

  isSameDay(r: any, today: Date): boolean {
    const d = this.getDate(r);
    return d.toDateString() === today.toDateString();
  }

  /* ================= BUILD DATA ================= */

  buildCharts() {

    let revenueMap: any = {};
    let dailyMap: any = {};
    let userMap: any = {};
    let statusMap = { completed: 0, cancelled: 0, pending: 0 };
    let monthlyTrend: any = {};

    this.filteredRides.forEach((r: any) => {

      const date = this.getDate(r);

      // ✅ SORTABLE KEYS
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);

      // 💰 REVENUE
      if (!revenueMap[monthKey]) revenueMap[monthKey] = 0;
      revenueMap[monthKey] += r.fare || r.payableAmount || 0;

      // 📊 DAILY COMPLETED
      if (!dailyMap[dayKey]) dailyMap[dayKey] = 0;
      if (r.status === 'completed') dailyMap[dayKey]++;

      // 👥 ACTIVE USERS
      if (r.passengerId) {
        if (!userMap[dayKey]) userMap[dayKey] = new Set();
        userMap[dayKey].add(r.passengerId);
      }

      // 🥧 STATUS COUNT
      if (r.status === 'completed') statusMap.completed++;
      else if (r.status === 'cancelled') statusMap.cancelled++;
      else statusMap.pending++;

      // 📈 MONTHLY TREND
      if (!monthlyTrend[monthKey]) monthlyTrend[monthKey] = 0;
      monthlyTrend[monthKey]++;
    });

    // convert Set → count
    Object.keys(userMap).forEach(k => {
      userMap[k] = userMap[k].size;
    });

    this.renderCharts(revenueMap, dailyMap, userMap, statusMap, monthlyTrend);
  }

  /* ================= RENDER ================= */

  renderCharts(revenueMap: any, dailyMap: any, userMap: any, statusMap: any, monthlyTrend: any) {

    // destroy old charts
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.dailyChart) this.dailyChart.destroy();
    if (this.userChart) this.userChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.lineChart) this.lineChart.destroy();

    // ✅ SORT KEYS
    const sortedDays = Object.keys(dailyMap).sort();
    const sortedUserDays = Object.keys(userMap).sort();
    const sortedMonths = Object.keys(monthlyTrend).sort();

    // 💰 REVENUE
    this.revenueChart = new Chart('revenueChart', {
      type: 'bar',
      data: {
        labels: sortedMonths,
        datasets: [{
          label: 'Revenue ₹',
          data: sortedMonths.map(m => revenueMap[m])
        }]
      }
    });

    // 📊 DAILY RIDES
    this.dailyChart = new Chart('dailyChart', {
      type: 'line',
      data: {
        labels: sortedDays,
        datasets: [{
          label: 'Completed Rides',
          data: sortedDays.map(d => dailyMap[d]),
          borderColor: '#3b82f6',
          fill: false
        }]
      }
    });

    // 👥 ACTIVE USERS
    this.userChart = new Chart('userChart', {
      type: 'line',
      data: {
        labels: sortedUserDays,
        datasets: [{
          label: 'Active Users',
          data: sortedUserDays.map(d => userMap[d]),
          borderColor: '#10b981',
          fill: false
        }]
      }
    });

    // 🥧 RIDE STATUS
    this.pieChart = new Chart('pieChart', {
      type: 'pie',
      data: {
        labels: ['Completed', 'Cancelled', 'Pending'],
        datasets: [{
          data: [
            statusMap.completed,
            statusMap.cancelled,
            statusMap.pending
          ]
        }]
      }
    });

    // 📈 MONTHLY TREND
    this.lineChart = new Chart('lineChart', {
      type: 'line',
      data: {
        labels: sortedMonths,
        datasets: [{
          label: 'Total Rides',
          data: sortedMonths.map(m => monthlyTrend[m]),
          borderColor: '#f59e0b',
          fill: false
        }]
      }
    });
  }

  /* ================= TOP DRIVERS ================= */

  async calculateTopDrivers() {

    const driverMap: any = {};

    this.rideList.forEach((r: any) => {
      if (!r.driverId) return;

      if (!driverMap[r.driverId]) {
        driverMap[r.driverId] = 0;
      }

      driverMap[r.driverId]++;
    });

    const sorted = Object.keys(driverMap).map(id => ({
      id,
      rides: driverMap[id],
      name: ''
    }))
    .sort((a, b) => b.rides - a.rides)
    .slice(0, 3);

    this.topDrivers = [];

    for (let d of sorted) {
      const snap = await getDoc(doc(db, 'users', d.id));
      if (snap.exists()) {
        d.name = snap.data()['name'];
      }
      this.topDrivers.push(d);
    }
  }
}
