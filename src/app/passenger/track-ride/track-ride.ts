import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase.config';
import { getAuth } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-track-ride',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-ride.html',
  styleUrls: ['./track-ride.css']
})
export class TrackRideComponent implements OnInit {

  activeRide:any = null;

  constructor(private router:Router){}

  async ngOnInit(){

    const auth = getAuth();
    const user = auth.currentUser;

    if(!user) return;

    const passengerId = user.uid;

    const rideQuery = query(
      collection(db,"ride_requests"),
      where("passengerId","==",passengerId),
      where("status","in",["accepted","started"])
    );

    const snapshot = await getDocs(rideQuery);

    if(snapshot.empty){
      console.log("No active ride");
      return;
    }

    this.activeRide = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };

  }

  openTracking(){

  this.router.navigate(
    ['/passenger/live-track'],
    {
      state: { ride: this.activeRide }
    }
  );

}

}
