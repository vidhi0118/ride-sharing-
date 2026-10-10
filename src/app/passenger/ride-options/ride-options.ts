import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from './../../firebase/firebase.config';
import { PassengerNavbarComponent } from '../passenger-navbar/passenger-navbar';
import { OnInit } from '@angular/core';
@Component({
  selector: 'app-ride-options',
  standalone: true,
  imports: [CommonModule, FormsModule, PassengerNavbarComponent],
  templateUrl: './ride-options.html',
  styleUrls: ['./ride-options.css']
})
export class RideOptionsComponent implements OnInit{

  passengersCount = 1;
  tripType = 'one-way';

  fromDate = '';
  toDate = '';
  rideTime = '';

  recommendedVehicles: string[] = [];
  vehiclePreference = '';

  luggageType = 'none';
  specialInstruction = '';
  customInstruction = '';

  routeData: any = {};
  selectedDriver: any = null;

  estimatedDays = 1;
  estimatedFare = 0;

  todayDate = new Date().toISOString().split('T')[0];

  vehicleCapacityMap: any = {
    Bike: 1,
    Auto: 3,
    Hatchback: 4,
    Sedan: 4,
    SUV: 6,
    Luxury: 4,
    'Mini Bus': 15
  };

  vehicleRateMap: any = {
    Bike: { base: 10, perKm: 8, perDay: 100 },
    Auto: { base: 10, perKm: 10, perDay: 100 },
    Hatchback: { base: 15, perKm: 12, perDay: 100 },
    Sedan: { base: 20, perKm: 15, perDay: 100 },
    SUV: { base: 30, perKm: 18, perDay: 100 },
    Luxury: { base: 50, perKm: 25, perDay: 100 },
    'Mini Bus': { base: 50, perKm: 30, perDay: 100 }
  };

constructor(private router: Router) {}
ngOnInit() {

 const storedRoute = localStorage.getItem('routeData');

if (storedRoute) {
  this.routeData = JSON.parse(storedRoute);
}

console.log("Route loaded:", this.routeData);
  const storedDriver = localStorage.getItem('selectedDriver');

  if (storedDriver) {
    this.selectedDriver = JSON.parse(storedDriver);
  }

  console.log("Driver loaded:", this.selectedDriver);

  // vehicle logic
  if (this.selectedDriver?.vehicles?.length) {

    this.recommendedVehicles =
      this.selectedDriver.vehicles.map((v: any) => v.name);

    this.vehiclePreference =
      this.selectedDriver.defaultVehicle ||
      this.recommendedVehicles[0];

  } else {
    this.recommendedVehicles = Object.keys(this.vehicleRateMap);
    this.vehiclePreference = 'Sedan';
  }

  this.calculateFare();
}
  /* ================= DATE VALIDATION ================= */
onTripTypeChange() {
  if (this.tripType === 'one-way') {
    this.toDate = '';
    this.estimatedDays = 1;
  }
  this.calculateFare();
}

  validateDates() {

  if (this.fromDate < this.todayDate) {
    alert("Past date not allowed");
    this.fromDate = '';
    return;
  }

  if (this.tripType === 'round-trip' && this.toDate && this.toDate < this.fromDate) {
    alert("Return date cannot be before start date");
    this.toDate = '';
  }

  this.calculateDays();
  this.calculateFare();
}

calculateDays() {

  if (!this.toDate || this.tripType === 'one-way') {
    this.estimatedDays = 1;
    return;
  }

  const start = new Date(this.fromDate);
  const end = new Date(this.toDate);

  const diff =
    (end.getTime() - start.getTime()) / (1000 * 3600 * 24);

  this.estimatedDays = diff + 1;
}

  /* ================= VEHICLE CHANGE ================= */

  onVehicleChange() {
    this.onPassengerChange();
    this.calculateFare();
  }

  getMaxCapacity(vehicle: string) {
    return this.vehicleCapacityMap[vehicle] || 4;
  }

  onPassengerChange() {

  const max = this.getMaxCapacity(this.vehiclePreference);

  if (this.passengersCount > max) {
    alert(`Driver vehicle allows only ${max} passengers`);
    this.passengersCount = max;
  }

  if (this.passengersCount < 1) {
    this.passengersCount = 1;
  }

  this.calculateFare();
}

  /* ================= FARE ================= */

calculateFare() {

  console.log("Distance received:", this.routeData?.distance);

  let distance = Number(this.routeData?.distance);

if (!distance || isNaN(distance)) {
  console.log("Distance missing → using fallback");
  distance = 5; // temporary safe value
}

  if (!distance || isNaN(distance)) {
    this.estimatedFare = 0;
    return;
  }

  let ratePerKm = 10; // one-way default

  // 🔁 round trip
  if (this.tripType === 'round-trip') {
    ratePerKm = 15;
    distance = distance * 2;
  }

  let fare = distance * ratePerKm;

  // 🎒 luggage charges
  if (this.luggageType === 'light') {
    fare += 100;   // small bags
  }

  if (this.luggageType === 'heavy') {
    fare += 300;   // big luggage
  }

  this.estimatedFare = Math.round(fare);
}

  /* ================= SUBMIT ================= */

async continueToDrivers() {

  const user = auth.currentUser;

  if (!user) {
    alert("Login required");
    return;
  }

  if (!this.fromDate || !this.rideTime) {
    alert("Select date & time");
    return;
  }
  if (!this.selectedDriver) {
  alert("Driver not selected");
  return;
}

if (!this.estimatedFare || isNaN(this.estimatedFare)) {
  alert("Fare not calculated properly");
  return;
}
  // ✅ ensure fare calculated
  this.calculateFare();

  if (!this.estimatedFare || isNaN(this.estimatedFare)) {
    alert("Fare not calculated properly");
    return;
  }

  try {

    // 🟢 STEP 1: CREATE RIDE
    const rideRes = await fetch(
      'http://localhost:5000/api/rides/book',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

       body: JSON.stringify({
  passengerId: user.uid,
  passengerEmail: user.email,

driverId: this.selectedDriver.id,
driverName: this.selectedDriver.name,

  from: this.routeData?.startName || "Unknown",
  to: this.routeData?.endName || "Unknown",

  fare: Number(this.estimatedFare || 100),

   rideDate: this.fromDate,
  rideTime: this.rideTime,
  paymentType: 100
})
      }
    );

    const rideData = await rideRes.json();

    if (!rideData.success) {
      alert("Failed to create ride");
      return;
    }

    const rideId = rideData.rideId;

    // 🟢 STEP 2: CREATE ORDER
    const orderRes = await fetch(
      'http://localhost:5000/api/rides/create-order',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId })
      }
    );

    const orderData = await orderRes.json();

    // 🟢 STEP 3: OPEN RAZORPAY
    const options: any = {
      key: "rzp_test_SRM3VQEh9bMMhD",
      amount: orderData.order.amount,
      currency: "INR",
      order_id: orderData.order.id,

      handler: async (response: any) => {

        alert("Payment Successful ✅");
        this.router.navigate(['/passenger/dashboard']);
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error(error);
    alert("Something went wrong");
  }
}
}
