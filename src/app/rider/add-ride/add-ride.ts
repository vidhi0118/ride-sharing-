import { firebaseApp } from './../../firebase/firebase.config';
import { appConfig } from './../../app.config';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import locations from '../../../assets/locations.json';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, auth } from './../../firebase/firebase.config';

@Component({
  selector: 'app-add-ride',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-ride.html',
  styleUrls: ['./add-ride.css']
})
export class AddRideComponent implements OnInit {

  data: any = locations.Gujarat;

  districts: string[] = [];
  fromVillages: string[] = [];
  toVillages: string[] = [];

  fromDistrict = '';
  toDistrict = '';
  fromVillage = '';
  toVillage = '';

  distance: number | null = null;
  estimatedTime: number | null = null;

  /* Availability */
  rideType: 'one-time' | 'daily' | 'weekend' = 'one-time';
  rideDate = '';
  startTime = '';
  endTime = '';

  /* Preferences */
  maxPassengers = 1;
  luggageAllowed = false;
  genderPreference: 'any' | 'male' | 'female' = 'any';

  /* 💰 PRICE */
  price: number | null = null;

  ngOnInit() {
    this.districts = Object.keys(this.data);
  }

  onFromDistrictChange() {
    this.fromVillages = Object.keys(this.data[this.fromDistrict] || {});
    this.fromVillage = '';
    this.calculate();
  }

  onToDistrictChange() {
    this.toVillages = Object.keys(this.data[this.toDistrict] || {});
    this.toVillage = '';
    this.calculate();
  }

  calculate() {
    if (!this.fromDistrict || !this.toDistrict || !this.fromVillage || !this.toVillage) {
      this.distance = null;
      this.estimatedTime = null;
      return;
    }

    const from = this.data[this.fromDistrict][this.fromVillage];
    const to = this.data[this.toDistrict][this.toVillage];

    this.distance = this.haversine(from.lat, from.lng, to.lat, to.lng);

    // Average speed = 40 km/h
    this.estimatedTime = this.distance / 40;
  }

  haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  toRad(val: number) {
    return val * Math.PI / 180;
  }

  async addRide() {
    if (!this.distance) {
      alert('Please select route properly');
      return;
    }

    if (this.rideType === 'one-time' && (!this.rideDate || !this.startTime || !this.endTime)) {
      alert('Please select date and time');
      return;
    }

    if (!this.price || this.price <= 0) {
      alert('Please enter valid price');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('User not logged in');
      return;
    }

    const rideData = {
      driverId: user.uid,

      // ✅ FINAL FORMAT: (Village, District)
      from: `(${this.fromVillage}, ${this.fromDistrict})`,
      to: `(${this.toVillage}, ${this.toDistrict})`,

      rideType: this.rideType,

      date: this.rideType === 'one-time' ? this.rideDate : 'Flexible',
      startTime: this.rideType === 'one-time' ? this.startTime : 'Flexible',
      endTime: this.rideType === 'one-time' ? this.endTime : 'Flexible',

      distance: this.distance,
      estimatedTime: this.estimatedTime,

      maxPassengers: this.maxPassengers,
      availableSeats: this.maxPassengers,

      luggageAllowed: this.luggageAllowed,
      genderPreference: this.genderPreference,

      price: this.price,
      createdAt: Timestamp.now()
    };

    await addDoc(collection(db, 'rides'), rideData);

    alert('Ride added successfully!');
    this.resetForm();
  }

  resetForm() {
    this.fromDistrict = '';
    this.toDistrict = '';
    this.fromVillage = '';
    this.toVillage = '';
    this.distance = null;
    this.estimatedTime = null;
    this.rideDate = '';
    this.startTime = '';
    this.endTime = '';
    this.maxPassengers = 1;
    this.luggageAllowed = false;
    this.genderPreference = 'any';
    this.price = null;
  }
}
