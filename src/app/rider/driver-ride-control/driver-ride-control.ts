import { LiveLocationService } from './../../services/live-location.service';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import axios from 'axios';

@Component({
  selector: 'app-driver-ride-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-ride-control.html',
  styleUrls: ['./driver-ride-control.css']
})
export class DriverRideControlComponent {

  constructor(private liveLocation: LiveLocationService) {}

  @Input() rideId!: string;
  @Input() rideData: any;

  db = getFirestore();

  /* ================= START RIDE ================= */

  async startRide(){

    if(!this.rideId){
      console.error("Ride ID missing");
      return;
    }

    try{

      const rideRef = doc(this.db,'ride_requests',this.rideId);

      await updateDoc(rideRef,{
        status:'started',
        startedAt: new Date()
      });

      /* 🚗 START LIVE GPS TRACKING */
      const driverId = this.rideData.driverId;
      this.liveLocation.startTracking(driverId);

      // 🔔 backend notification
      await axios.post(
        'http://localhost:5000/api/driver/start-ride',
        {
          requestId:this.rideId,
          passengerEmail:this.rideData.passengerEmail,
          data:this.rideData
        }
      );

      alert("Ride Started 🚗");

    }catch(err){
      console.error("Start Ride Error:",err);
    }

  }

  /* ================= END RIDE ================= */

  async endRide(){

    if(!this.rideId){
      console.error("Ride ID missing");
      return;
    }

    try{

      const rideRef = doc(this.db,'ride_requests',this.rideId);

      await updateDoc(rideRef,{
        status:'completed',
        completedAt: new Date()
      });

      await axios.post(
        'http://localhost:5000/api/driver/complete-ride',
        {
          requestId:this.rideId,
          passengerEmail:this.rideData.passengerEmail,
          data:this.rideData
        }
      );

      alert("Ride Completed ✅");

    }catch(err){
      console.error("End Ride Error:",err);
    }

  }

}
