import { Component, OnInit } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.css']
})
export class Bookings implements OnInit {

  bookings: any[] = [];

  async ngOnInit() {
    const snap = await getDocs(collection(db, 'bookings'));
    this.bookings = snap.docs.map(d => d.data());
  }
}
