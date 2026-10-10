import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var google: any;

@Component({
  selector: 'app-live-track',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-track.html',
  styleUrls: ['./live-track.css']
})
export class LiveTrackComponent implements OnInit, AfterViewInit {

  map: any;
  directionsService: any;
  directionsRenderer: any;

  pickup!: { lat: number, lng: number };
  destination!: { lat: number, lng: number };

  etaText = '';
  distanceText = '';

  rideData: any;

  ngOnInit() {

    this.rideData = history.state?.ride;

    // Pickup (Passenger)
    this.pickup = {
      lat: this.rideData?.fromLat || 21.1702,
      lng: this.rideData?.fromLng || 72.8311
    };

    // Destination (Driver current / ride end)
    this.destination = {
      lat: this.rideData?.toLat || 20.7696,
      lng: this.rideData?.toLng || 72.9613
    };
  }

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {

    this.map = new google.maps.Map(document.getElementById('map'), {
      center: this.destination, // 🔥 focus on driver first
      zoom: 10
    });

    this.directionsService = new google.maps.DirectionsService();

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: '#28a745', // 🟢 green for live tracking
        strokeWeight: 5
      }
    });

    this.directionsRenderer.setMap(this.map);

    this.drawRoute();
  }

  // 🔥 REVERSED ROUTE (driver ➝ passenger)
  drawRoute() {

    this.directionsService.route({
      origin: this.destination,   // 🚗 driver
      destination: this.pickup,   // 📍 passenger
      travelMode: 'DRIVING'
    }, (result: any, status: any) => {

      if (status === 'OK') {

        this.directionsRenderer.setDirections(result);

        const leg = result.routes[0].legs[0];

        this.distanceText = leg.distance.text;
        this.etaText = leg.duration.text;
      }
    });
  }
}
