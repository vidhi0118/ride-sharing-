import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import axios from 'axios';
import { PassengerNavbarComponent } from '../passenger-navbar/passenger-navbar';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from './../../firebase/firebase.config';
import { LiveLocationService } from './../../services/live-location.service';
import * as L from 'leaflet';
//import 'leaflet-routing-machine';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
 shadowUrl: 'assets/leaflet/marker-shadow.png'
});

@Component({
  selector: 'app-view-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule, PassengerNavbarComponent],
  templateUrl: './view-drivers.html',
  styleUrls: ['./view-drivers.css']
})
export class ViewDriversComponent implements OnInit {

  drivers: any[] = [];
allDrivers: any[] = [];
distanceKm: number = 0;
  fromDate = '';
  toDate = '';
  selectedVehicle = '';
  selectedCity = '';

  vehicles = ['Bike', 'Car', 'Large Vehicle'];
  cities: string[] = [];
routeLine: any;
  searchRadius = 20;
selectedDriverId: string | null = null;
  getVehicleIcon(vehicle: string) {

  let emoji = "🚗";

  if(vehicle === "Bike"){
    emoji = "🏍️";
  }
  else if(vehicle === "Large Vehicle"){
    emoji = "🚌";
  }

  return L.divIcon({
    html: `<div style="font-size:28px">${emoji}</div>`,
    className: "",
    iconSize: [30,30]
  });

}

driverMarkers: L.Marker[] = [];
  /* ================= ROUTE VARIABLES ================= */

  startQuery = '';
  endQuery = '';

  startSuggestions: any[] = [];
  endSuggestions: any[] = [];

  startLocation!: { lat:number, lng:number };
  endLocation!: { lat:number, lng:number };
selectedDriver: any;
  distanceText = '';

  private startTimeout:any;
private endTimeout:any;

isRouteSelected(): boolean {
  return !!(this.startLocation && this.endLocation);
}

  /* ================= MAP VARIABLES ================= */

  map!: L.Map;
  pickupMarker!: L.Marker;
  dropMarker!: L.Marker;
  routeControl: any;

  constructor(
  private router: Router,
  private liveLocation: LiveLocationService
) {}

  async ngOnInit() {

  await this.fetchDrivers();
  await this.loadCities();
  this.fitMapToMarkers();
  const nav = this.router.getCurrentNavigation();

  if (nav?.extras?.state) {
    const state: any = nav.extras.state;

    this.selectedDriver = state.selectedDriver;


    console.log("Selected Driver:", this.selectedDriver);
  }


  // listen to each driver's location
  this.drivers.forEach((driver:any)=>{

  const driverId = driver.id;

  this.liveLocation.listenDriver(driverId,(lat:any,lng:any)=>{

    this.moveDriverMarker(driverId, lat, lng, driver);

  });

});
this.showPassengerLocation();
}

  showDriversOnMap(){

  if(!this.map) return;

  this.drivers.forEach(driver => {

    if(!driver.lat || !driver.lng) return;

    const icon = this.getVehicleIcon(driver.defaultVehicle);

    const marker = L.marker(
      [driver.lat, driver.lng],
      { icon }
    ).addTo(this.map);

    marker.bindTooltip(
      `${driver.name} (${driver.defaultVehicle})`,
      { direction: 'top' }
    );

  });

}
  /* ================= FETCH DRIVERS ================= */

  async fetchDrivers() {

  try {

    const querySnapshot = await getDocs(collection(db, "users"));

    const driverList: any[] = [];

    for (const docSnap of querySnapshot.docs) {

      const data: any = docSnap.data();

      if (data.role === "driver") {

        const driverId = docSnap.id;

        // ⭐ GET RATING HERE
        const rating = await this.getDriverRating(driverId);

        driverList.push({
          id: driverId,
          ...data,
          rating: rating
        });

      }
    }

    this.allDrivers = driverList;
    this.drivers = driverList;

    console.log("Drivers with rating:", this.drivers);

  } catch (error) {
    console.error("Driver fetch error:", error);
  }
}
  /* ================= LOCATION SEARCH ================= */

  async searchLocation(query:string, type:'start'|'end') {

  if(query.length < 3){
    if(type === 'start') this.startSuggestions = [];
    else this.endSuggestions = [];
    return;
  }

  if(type === 'start'){
    clearTimeout(this.startTimeout);
  } else {
    clearTimeout(this.endTimeout);
  }

  const timer = setTimeout(async () => {

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

      console.log("API RESULT:", response.data);

      if(type === 'start'){
        this.startSuggestions = [...response.data];
      } else {
        this.endSuggestions = [...response.data];
      }

    } catch(err){
      console.error("Search error:", err);
    }

  }, 400);

  if(type === 'start'){
    this.startTimeout = timer;
  } else {
    this.endTimeout = timer;
  }
}

  /* ================= FETCH DRIVER CITIES ================= */

async loadCities() {

  try {

    const querySnapshot = await getDocs(collection(db, "drivers"));

    const citySet = new Set<string>();

    querySnapshot.forEach((doc) => {

      const data: any = doc.data();

      if (data.city) {
        citySet.add(data.city);
      }

    });

    this.cities = Array.from(citySet);

  } catch (error) {
    console.error("City fetch error:", error);
  }

}

  /* ================= MAP INIT ================= */

initMap(lat:number, lng:number){

  setTimeout(() => {

    const mapElement = document.getElementById('map');

    if(!mapElement){
      console.log("Map container not ready");
      return;
    }

    // 🔥 prevent re-initialization
    if(this.map){
      this.map.setView([lat,lng],13);
      return;
    }

    this.map = L.map('map').setView([lat,lng],13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap'
    }).addTo(this.map);

    console.log("Map initialized ✅");

  },300);
}

  /* ================= SELECT LOCATION ================= */

selectLocation(loc:any, type:'start'|'end'){

  if(type === 'start'){

  this.startQuery = loc.display_name;

  this.startLocation = {
    lat: +loc.lat,
    lng: +loc.lon
  };

  this.startSuggestions = [];

  // 🔥 ADD THIS
  this.initMap(this.startLocation.lat, this.startLocation.lng);

  this.filterDriversByRadius();
} else {

    this.endQuery = loc.display_name;

    this.endLocation = {
      lat: +loc.lat,
      lng: +loc.lon
    };

    this.endSuggestions = [];

    console.log("End selected:", this.endLocation);
 this.drawRoute();
  }

}

async getDriverRating(driverId: string) {

  const q = query(
    collection(db, 'ride_requests'),
    where('driverId', '==', driverId)
  );

  const snapshot = await getDocs(q);

  let total = 0;
  let count = 0;

  snapshot.forEach(doc => {
    const data: any = doc.data();

    if (data.rating && data.status === 'completed') {
      total += Number(data.rating);
      count++;
    }
  });

  return count > 0 ? (total / count).toFixed(1) : 0;
}

showAllDriversOnMap(){

  if(!this.map) return;

  // 🔥 clear old markers
  Object.values(this.driverMarkersMap).forEach((marker:any)=>{
    this.map.removeLayer(marker);
  });

  this.driverMarkersMap = {};

  this.drivers.forEach(driver => {

    if(!driver.lat || !driver.lng) return;

    const icon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
      iconSize: [30,30]
    });

    const marker = L.marker([driver.lat, driver.lng], { icon })
      .addTo(this.map)
      .bindTooltip(`🚗 ${driver.name}`);

    this.driverMarkersMap[driver.id] = marker;

  });

}

fitMapToMarkers(){

  if(!this.map) return;

  const group = L.featureGroup(
    Object.values(this.driverMarkersMap)
  );

  if(group.getLayers().length){
    this.map.fitBounds(group.getBounds().pad(0.2));
  }

}
  /* ================= DRAW ROUTE ================= */

  async drawRoute(){

  if(!this.startLocation || !this.endLocation) return;
  if(!this.map) return;

  try {

    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${this.startLocation.lng},${this.startLocation.lat};` +
      `${this.endLocation.lng},${this.endLocation.lat}` +
      `?overview=full&geometries=geojson`;

    const response = await axios.get(url);

    const route = response.data.routes[0];

    const coordinates = route.geometry.coordinates.map((coord:any)=>[
      coord[1], coord[0]
    ]);

    // 🔥 REMOVE OLD ROUTE
    if(this.routeLine){
      this.map.removeLayer(this.routeLine);
    }

    // 🔥 DRAW NEW ROAD ROUTE
    this.routeLine = L.polyline(coordinates, {
      color: '#1976D2',
      weight: 5
    }).addTo(this.map);

    // 🔥 FIT MAP
    this.map.fitBounds(this.routeLine.getBounds(), {
      padding: [50,50]
    });

    // 🔥 DISTANCE + ETA
   this.distanceKm = route.distance / 1000; // ✅ store number

const durationMin = route.duration / 60;

this.distanceText =
  `${this.distanceKm.toFixed(2)} km • ${durationMin.toFixed(0)} mins`;

    console.log("Route:", this.distanceText);

  } catch(err){
    console.error("OSRM error:", err);
  }

}

  /* ================= DISTANCE ================= */

  calculateDistance(){

    if(!this.startLocation || !this.endLocation) return;

    const R = 6371;

    const dLat = this.deg2rad(this.endLocation.lat - this.startLocation.lat);
    const dLng = this.deg2rad(this.endLocation.lng - this.startLocation.lng);

    const a =
      Math.sin(dLat/2)*Math.sin(dLat/2) +
      Math.cos(this.deg2rad(this.startLocation.lat)) *
      Math.cos(this.deg2rad(this.endLocation.lat)) *
      Math.sin(dLng/2)*Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c;

    this.distanceText = distance.toFixed(2) + ' km';

  }

  deg2rad(deg:number){
    return deg * (Math.PI/180);
  }

  calculateDriverDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {

  const R = 6371;

  const dLat = this.deg2rad(lat2 - lat1);
  const dLng = this.deg2rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.deg2rad(lat1)) *
    Math.cos(this.deg2rad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

  /* ================= DRIVER RADIUS FILTER ================= */

filterDriversByRadius(){

  if(!this.startLocation) return;

  // 🔥 1. Extract city from selected pickup
  const fullAddress = this.startQuery.toLowerCase();

  // simple city extraction (example: valsad)
  let selectedCity = '';

  if(fullAddress.includes('valsad')) selectedCity = 'valsad';
  else if(fullAddress.includes('surat')) selectedCity = 'surat';
  else if(fullAddress.includes('ahmedabad')) selectedCity = 'ahmedabad';
  else if(fullAddress.includes('anand')) selectedCity = 'anand';

  console.log("Selected city:", selectedCity);

  // 🔥 2. Filter drivers by city
  if(selectedCity){
    this.drivers = this.allDrivers.filter((d:any)=>
      d.city?.toLowerCase().includes(selectedCity)
    );
  } else {
    this.drivers = [...this.allDrivers];
  }

  // 🔥 3. Sort nearest
  this.sortDriversByDistance();

  // 🔥 4. Update map
  this.showAllDriversOnMap();
  this.fitMapToMarkers();
}

  /* ================= BOOK DRIVER ================= */

 bookDriver(driver: any) {

  if (!this.distanceKm || this.distanceKm <= 0) {
    alert("Please select route first");
    return;
  }

  // ✅ SAVE DRIVER
  localStorage.setItem('selectedDriver', JSON.stringify(driver));

  // ✅ SAVE ROUTE DATA (FIX HERE 🔥)
  localStorage.setItem('routeData', JSON.stringify({
    start: this.startLocation,
    end: this.endLocation,
    distance: this.distanceKm,

    // 🔥 THIS IS IMPORTANT FIX
    startName: this.startQuery || "Start Location",
    endName: this.endQuery || "End Location"
  }));

  console.log("Saved route:", this.startQuery, this.endQuery);

  this.router.navigate(['/passenger/ride-options']);
}

driverMarkersMap: { [key: string]: L.Marker } = {};

moveDriverMarker(driverId: string, lat: number, lng: number, driver: any) {

  // ❌ if map not ready
  if (!this.map) {
    console.log("Map not ready yet");
    return;
  }

  // ❌ invalid location
  if (!lat || !lng) {
    console.log("Invalid location:", lat, lng);
    return;
  }

  const icon = this.getVehicleIcon(driver.defaultVehicle);

  if (this.driverMarkersMap[driverId]) {
    this.driverMarkersMap[driverId].setLatLng([lat, lng]);
  } else {
    const marker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindTooltip(`🚗 ${driver.name}`);

    this.driverMarkersMap[driverId] = marker;
  }
}

showPassengerLocation(){

  if(!navigator.geolocation){
    console.log("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition((pos)=>{

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    console.log("User location:", lat, lng);

    // 🔥 Init map if not exists
    if(!this.map){
      this.initMap(lat, lng);
    }

    const userIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      iconSize: [35,35]
    });

    L.marker([lat,lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup("📍 You are here");

    this.map.setView([lat,lng], 13);

  });

}
sortDriversByDistance(){

  if(!this.startLocation) return;

  this.drivers.sort((a:any, b:any)=>{

    const d1 = this.calculateDriverDistance(
      this.startLocation.lat,
      this.startLocation.lng,
      a.lat,
      a.lng
    );

    const d2 = this.calculateDriverDistance(
      this.startLocation.lat,
      this.startLocation.lng,
      b.lat,
      b.lng
    );

    return d1 - d2; // nearest first
  });

}


}
