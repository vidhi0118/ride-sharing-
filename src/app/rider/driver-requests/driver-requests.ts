import { PassengerNavbarComponent } from './../../passenger/passenger-navbar/passenger-navbar';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from './../../firebase/firebase.config';


@Component({
  selector: 'app-driver-requests',
  standalone: true,
  imports: [CommonModule, PassengerNavbarComponent],
  templateUrl: './driver-requests.html',
  styleUrls: ['./driver-requests.css']
})
export class DriverRequestsComponent implements OnInit {

  requests: any[] = [];
  db = getFirestore();

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await this.loadRequests();
  }

  /* ===============================
     LOAD PENDING REQUESTS
  =============================== */

  async loadRequests() {

    if (!auth.currentUser) return;

    const q = query(
      collection(this.db, 'ride_requests'),
      where('status', '==', 'pending'),
      where('driverId', '==', auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);

    this.requests = [];

    snapshot.forEach(doc => {
      this.requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
  }

  /* ===============================
     ACCEPT REQUEST
  =============================== */

  async acceptRequest(request: any) {

    try {
      await this.http.post('http://localhost:5000/api/driver/accept-request', {
        requestId: request.id,
        rideId: request.rideId || null,
        passengerEmail: request.passengerEmail || '',
        data: request
      }).toPromise();

      alert("Ride accepted ✅");
      this.loadRequests();

    } catch (err) {
      console.error(err);
      alert("Error accepting request");
    }
  }

  /* ===============================
     REJECT REQUEST
  =============================== */

  async rejectRequest(request: any) {

    try {
      await this.http.post('http://localhost:5000/api/driver/reject-request', {
        requestId: request.id,
        passengerEmail: request.passengerEmail || '',
        data: request
      }).toPromise();

      alert("Ride rejected ❌");
      this.loadRequests();

    } catch (err) {
      console.error(err);
      alert("Error rejecting request");
    }
  }
}
