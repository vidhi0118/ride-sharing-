import { firebaseApp } from './../../firebase/firebase.config';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import locations from '../../../assets/locations.json';
import { PassengerNavbarComponent } from '../passenger-navbar/passenger-navbar';
import { auth } from './../../firebase/firebase.config';

@Component({
  selector: 'app-search-ride',
  standalone: true,
  imports: [CommonModule, FormsModule, PassengerNavbarComponent],
  templateUrl: './search-ride.html',
  styleUrls: ['./search-ride.css']
})
export class SearchRideComponent implements OnInit {

  locationData: any = (locations as any).Gujarat;
  flatLocations: string[] = [];

  startPoint = '';
  endPoint = '';
  vehicleType = '';

  vehicles = [
    '🛵 Bike',
    '🛺 Auto',
    '🚗 Car',
    '🚙 SUV'
  ];

  sameLocationError = false;

  constructor(private router: Router) {}

  ngOnInit() {
    Object.keys(this.locationData).forEach(district => {
      Object.keys(this.locationData[district]).forEach(area => {
        this.flatLocations.push(`${district} - ${area}`);
      });
    });
  }

  swapLocations() {
    const temp = this.startPoint;
    this.startPoint = this.endPoint;
    this.endPoint = temp;
  }

  async findRide() {

    if (!auth.currentUser) {
      alert('Please login to find a ride');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.startPoint || !this.endPoint) {
      alert('Please select start and end point');
      return;
    }

    if (this.startPoint === this.endPoint) {
      this.sameLocationError = true;
      return;
    }

    const [fromDistrict, fromArea] = this.startPoint.split(' - ');
    const [toDistrict, toArea] = this.endPoint.split(' - ');

    this.router.navigate(['/passenger/ride-list'], {
      queryParams: {
        fromDistrict,
        fromArea,
        toDistrict,
        toArea,
        vehicle: this.vehicleType || 'any'
      }
    });
  }
}
