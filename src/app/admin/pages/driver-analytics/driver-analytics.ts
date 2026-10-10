import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';
import Chart from 'chart.js/auto';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-analytics.html',
  styleUrls: ['./driver-analytics.css']
})
export class DriverAnalytics implements OnInit {

  drivers: any[] = [];
  selectedDriver = '';

  rides: any[] = [];

  filterDays = 30;

  earningsChart: any;
  rideChart: any;
  pieChart: any;

  async ngOnInit() {

    const userSnap = await getDocs(collection(db, 'users'));

    this.drivers = userSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((u: any) => u.role === 'driver');

    const rideSnap = await getDocs(collection(db, 'ride_requests'));

    this.rides = rideSnap.docs.map(d => d.data());
  }

  /* 🔥 LOAD ANALYTICS */
  loadAnalytics() {

    const now = new Date();

    const filtered = this.rides.filter(r => {

      if (r['driverId'] !== this.selectedDriver) return false;

      if (!r['createdAt']?.seconds) return false;

      const rideDate = new Date(r['createdAt'].seconds * 1000);

      const diff = (now.getTime() - rideDate.getTime()) / (1000 * 60 * 60 * 24);

      return diff <= this.filterDays;
    });

    this.renderCharts(filtered);
  }

  /* 📊 CHARTS */
  renderCharts(rides: any[]) {

    // DESTROY OLD
    this.earningsChart?.destroy();
    this.rideChart?.destroy();
    this.pieChart?.destroy();

    let earnings = 0;
    let completed = 0;
    let cancelled = 0;

    const days: any = {};

    rides.forEach(r => {

      const date = new Date(r['createdAt'].seconds * 1000).toLocaleDateString();

      if (!days[date]) days[date] = 0;

      const fare = r['payableAmount'] || r['fare'] || 0;

      if (r['status'] === 'completed') {
        earnings += fare;
        days[date] += fare;
        completed++;
      }

      if (r['status'] === 'cancelled') {
        cancelled++;
      }
    });

    const labels = Object.keys(days);
    const values = Object.values(days);

    // 💰 EARNINGS BAR
    this.earningsChart = new Chart('earningsChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Earnings',
          data: values
        }]
      }
    });

    // 📈 RIDE TREND
    this.rideChart = new Chart('rideChart', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Daily Earnings Trend',
          data: values
        }]
      }
    });

    // 🥧 PIE
    this.pieChart = new Chart('pieChart', {
      type: 'pie',
      data: {
        labels: ['Completed', 'Cancelled'],
        datasets: [{
          data: [completed, cancelled]
        }]
      }
    });
  }
}
