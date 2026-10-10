import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';
import Chart from 'chart.js/auto';

// 🔥 PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-analytics.html',
  styleUrls: ['./admin-analytics.css']
})
export class AdminAnalytics implements OnInit {

  rides: any[] = [];
  users: any[] = [];

  filterDays = 30;

  totalRevenue = 0;
  totalRides = 0;
  totalUsers = 0;
  cancelRate: any = 0;

  revenueChart: any;
  rideChart: any;
  pieChart: any;

  async ngOnInit() {

    const rideSnap = await getDocs(collection(db, 'ride_requests'));
    const userSnap = await getDocs(collection(db, 'users'));

    this.rides = rideSnap.docs.map(d => d.data());
    this.users = userSnap.docs.map(d => d.data());

    this.loadAnalytics();
  }

  loadAnalytics() {

    const now = new Date();

    let completed = 0;
    let cancelled = 0;

    const dailyRevenue: any = {};
    const dailyRides: any = {};

    this.totalRevenue = 0;

    const filtered = this.rides.filter(r => {

      if (!r['createdAt']?.seconds) return false;

      const date = new Date(r['createdAt'].seconds * 1000);
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

      return diff <= this.filterDays;
    });

    filtered.forEach(r => {

      const date = new Date(r['createdAt'].seconds * 1000)
        .toLocaleDateString();

      if (!dailyRevenue[date]) dailyRevenue[date] = 0;
      if (!dailyRides[date]) dailyRides[date] = 0;

      const amount = r['payableAmount'] || r['fare'] || 0;

      if (r['status'] === 'completed') {
        this.totalRevenue += amount;
        dailyRevenue[date] += amount;
        completed++;
      }

      if (r['status'] === 'cancelled') {
        cancelled++;
      }

      dailyRides[date]++;
    });

    this.totalRides = filtered.length;
    this.totalUsers = this.users.length;

    this.cancelRate = this.totalRides
      ? ((cancelled / this.totalRides) * 100).toFixed(1)
      : 0;

    this.renderCharts(dailyRevenue, dailyRides, completed, cancelled);
  }

  renderCharts(revenue: any, rides: any, completed: number, cancelled: number) {

    this.revenueChart?.destroy();
    this.rideChart?.destroy();
    this.pieChart?.destroy();

    const labels = Object.keys(revenue);

    this.revenueChart = new Chart('revChart', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: Object.values(revenue)
        }]
      }
    });

    this.rideChart = new Chart('rideChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Rides',
          data: Object.values(rides)
        }]
      }
    });

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

  /* 🔥 PDF EXPORT */
  async exportPDF() {

    const element = document.getElementById('analyticsContent');

    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
    pdf.save('admin-analytics.pdf');
  }
}
