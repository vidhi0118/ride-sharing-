import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.html',
  styleUrls: ['./payments.css']
})
export class Payments implements OnInit {

  payments: any[] = [];
  filtered: any[] = [];

  usersMap: Map<string, any> = new Map();

  selectedStatus = 'all';

  totalRevenue = 0;
  totalRefund = 0;
  totalPenalty = 0;

  COMMISSION = 0.1;

  async ngOnInit() {

    // 🔹 LOAD USERS
    const userSnap = await getDocs(collection(db, 'users'));
    userSnap.docs.forEach(d => {
      this.usersMap.set(d.id, d.data());
    });

    // 🔹 LOAD PAYMENTS
    const snap = await getDocs(collection(db, 'ride_requests'));

    this.payments = snap.docs
      .map(d => {

        const data: any = d.data();

        // ✅ ONLY THESE RECORDS
        if (!['cancelled', 'completed', 'payment_pending'].includes(data.status)) {
          return null;
        }

        const passenger = data.passengerId
          ? this.usersMap.get(data.passengerId)
          : null;

        const amount = data.fare || data.payableAmount;

        if (!amount) return null;

        let revenue = 0;
        let refund = 0;

        // ✅ COMPLETED
        if (data.status === 'completed') {
          revenue = Math.round(amount * this.COMMISSION);
        }

        // ✅ CANCELLED
        if (data.status === 'cancelled') {
          refund = amount - (data.penalty || 0);
          revenue = data.penalty || 0;
        }

        return {
          id: d.id,
          passenger: passenger?.name || 'Unknown',

          amount,
          status: data.status,
          paymentStatus: data.paymentStatus || 'pending',

          penalty: data.penalty || 0,
          revenue,
          refund,

          createdAt: data.createdAt,
          date: this.formatTime(data.createdAt)
        };

      })
      .filter(p => p !== null);

    // 🔥 SORT (LATEST FIRST)
    this.payments.sort((a: any, b: any) => {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    // 🔥 TOTAL CALCULATION
    this.totalRevenue = 0;
    this.totalRefund = 0;
    this.totalPenalty = 0;

    this.payments.forEach(p => {
      this.totalRevenue += p.revenue;
      this.totalRefund += p.refund;
      this.totalPenalty += p.penalty;
    });

    this.filtered = [...this.payments];
  }

  /* 🔍 FILTER */
  applyFilter() {

    if (this.selectedStatus === 'all') {
      this.filtered = [...this.payments];
    } else {
      this.filtered = this.payments.filter(p =>
        p.paymentStatus === this.selectedStatus
      );
    }
  }

  /* 🕒 FORMAT DATE */
  formatTime(ts: any) {
    if (!ts?.seconds) return '-';

    const d = new Date(ts.seconds * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  /* 📄 EXPORT */
  exportCSV() {

    let csv = 'Date,Passenger,Amount,Status,Payment,Penalty,Revenue,Refund\n';

    this.filtered.forEach(p => {
      csv += `${p.date},${p.passenger},${p.amount},${p.status},${p.paymentStatus},${p.penalty},${p.revenue},${p.refund}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
  }
}
