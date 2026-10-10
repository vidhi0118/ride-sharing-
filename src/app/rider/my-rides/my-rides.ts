import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase.config';

@Component({
  selector: 'app-my-rides',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-rides.html',
  styleUrls: ['./my-rides.css']
})
export class MyRides implements OnInit {

  exactMatches: any[] = [];
  nearMatches: any[] = [];
  otherRequests: any[] = [];

  async ngOnInit() {
    const snapshot = await getDocs(collection(db, 'route_requests'));

    snapshot.forEach(doc => {
      const req: any = { id: doc.id, ...doc.data() };

      // 🔥 MATCHING LOGIC
      if (this.isExactMatch(req)) {
        this.exactMatches.push(req);
      } else if (this.isNearMatch(req)) {
        this.nearMatches.push(req);
      } else {
        this.otherRequests.push(req);
      }
    });
  }

  // 🥇 Exact route match
  isExactMatch(req: any): boolean {
    return req.fromDistrict && req.toDistrict;
  }

  // 🥈 Same district match
  isNearMatch(req: any): boolean {
    return req.fromDistrict === req.toDistrict;
  }

  acceptRequest(req: any) {
    alert('Passenger request accepted!');
  }
}
