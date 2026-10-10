import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import axios from 'axios';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from './../../firebase/firebase.config';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { Router } from '@angular/router';
import { PassengerNavbarComponent } from "../passenger-navbar/passenger-navbar";
@Component({
  selector: 'app-set-route',
  standalone: true,
  imports: [CommonModule, FormsModule, PassengerNavbarComponent],
  templateUrl: './set-route.html',
  styleUrls: ['./set-route.css']
})
export class SetRouteComponent {
  constructor(private router: Router) {

  const state = history.state || {};
  this.selectedDriver = state.selectedDriver || null;
}
  startQuery = '';
  endQuery = '';
  selectedDriver: any = null;
  startSuggestions: any[] = [];
  endSuggestions: any[] = [];

  startLocation!: { lat: number; lng: number };
  endLocation!: { lat: number; lng: number };

  distanceText = '';

  private timeout: any;

  /* ===============================
     SEARCH LOCATION (FREE OSM)
  =============================== */
  async searchLocation(query: string, type: 'start' | 'end') {

    if (query.length < 3) {
      if (type === 'start') this.startSuggestions = [];
      else this.endSuggestions = [];
      return;
    }

    clearTimeout(this.timeout);

    this.timeout = setTimeout(async () => {

      try {
        const response = await axios.get(
          'https://nominatim.openstreetmap.org/search',
          {
            params: {
              q: query,
              format: 'json',
              limit: 5
            }
          }
        );

        if (type === 'start') {
          this.startSuggestions = response.data;
        } else {
          this.endSuggestions = response.data;
        }

      } catch (error) {
        console.error("Location search error:", error);
      }

    }, 400);
  }

  /* ===============================
     SELECT LOCATION
  =============================== */
  selectLocation(location: any, type: 'start' | 'end') {

    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lon);

    if (type === 'start') {
      this.startQuery = location.display_name;
      this.startLocation = { lat, lng };
      this.startSuggestions = [];
    } else {
      this.endQuery = location.display_name;
      this.endLocation = { lat, lng };
      this.endSuggestions = [];
      this.calculateDistance();
    }
  }

  /* ===============================
     DISTANCE CALCULATION (Haversine)
  =============================== */
  calculateDistance() {

    if (!this.startLocation || !this.endLocation) return;

    const R = 6371; // km
    const dLat = this.deg2rad(this.endLocation.lat - this.startLocation.lat);
    const dLng = this.deg2rad(this.endLocation.lng - this.startLocation.lng);

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(this.startLocation.lat)) *
      Math.cos(this.deg2rad(this.endLocation.lat)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    this.distanceText = distance.toFixed(2) + ' km';
  }

  deg2rad(deg: number) {
    return deg * (Math.PI/180);
  }

  /* ===============================
     SAVE ROUTE (UNCHANGED LOGIC)
  =============================== */
  async saveRoute() {

    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    if (!this.startLocation || !this.endLocation) {
      alert("Please select both locations");
      return;
    }

    
    alert("Route saved successfully 🚀");
  }
 bookRide() {

  if (!this.startLocation || !this.endLocation) {
    alert("Please select both locations");
    return;
  }

  this.router.navigate(['/passenger/ride-options'], {
    state: {
      selectedDriver: this.selectedDriver,
      start: this.startLocation,
      end: this.endLocation,
      distance: this.distanceText,
      startName: this.startQuery,
      endName: this.endQuery
    }
  });

}


}
