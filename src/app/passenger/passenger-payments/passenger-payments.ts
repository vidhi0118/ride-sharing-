import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';   // ✅ ADD THIS
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './../../firebase/firebase.config';

@Component({
  selector: 'app-passenger-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './passenger-payments.html',
  styleUrls: ['./passenger-payments.css']
})
export class PassengerPaymentsComponent implements OnInit {

  payments: any[] = [];


  async ngOnInit() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, 'ride_requests'),
    where('passengerId', '==', user.uid)
  );

  const snapshot = await getDocs(q);

  this.payments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log("Payments:", this.payments); // ✅ debug
}

}
