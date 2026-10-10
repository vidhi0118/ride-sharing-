import { Component, OnInit,AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { db, auth } from './../firebase/firebase.config';
import { PassengerNavbarComponent } from './../passenger/passenger-navbar/passenger-navbar';
import { AuthService, UserRole } from '../services/auth.service';
import { Chart } from 'chart.js/auto';
import jsPDF from 'jspdf';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { ViewChild, ElementRef } from '@angular/core';
import axios from 'axios';
import { DriverRideHistoryComponent } from '../rider/driver-ride-history/driver-ride-history';
import { DriverRideControlComponent } from '../rider/driver-ride-control/driver-ride-control';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PassengerNavbarComponent,DriverRideControlComponent,DriverRideHistoryComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, AfterViewInit {
@ViewChild('pieCanvas') pieCanvas!: ElementRef;
  role: UserRole | null = null;
  activeTab: string = 'overview';

  totalEarnings = 0;
  averageRating = 0;
  totalRides = 0;
ngAfterViewInit() {
  setTimeout(() => {
    this.renderPieChart();
  }, 100);
}
  pendingRequests: any[] = [];
  acceptedRides: any[] = [];
  experienceYears = 0;
  experienceText = '';
  driverRating: any = { avg: 0, count: 0 };
  private db = getFirestore();
  currentUid = '';
selectedPhoto!: File;
previewUrl: string | null = null;
rides: any[] = [];
monthlyEarnings: any[] = [];
filteredRides: any[] = [];
selectedFilter = 'all';
chart: any;
  /* ================= VEHICLE OPTIONS ================= */

  vehicleCategories = ['Car', 'Bike', 'Large Vehicle', 'Other'];

  carBrands = ['Maruti Suzuki','Hyundai','Tata','Honda','Toyota','Kia','Mahindra','Skoda','Volkswagen','Renault','Other'];
  bikeBrands = ['Honda','TVS','Bajaj','Royal Enfield','Yamaha','Hero','KTM','Suzuki','Other'];
  largeVehicleBrands = ['Toyota Innova','Force Traveller','Mahindra Bolero','Tata Winger','Ashok Leyland','Eicher','Other'];

  selectedCategory = '';
  selectedBrand = '';
  customVehicleName = '';
  vehicleYear: number | null = null;
  vehicleSeats: number | null = null;

  driverProfile: any = {
  name: '',
  email: '',
  photoUrl: '',
  city: '',
  lat: null,
  lng: null,
  drivingStartDate: '',
  vehicles: [],
  defaultVehicle: null
};

pieChart: any;
completedCount = 0;
cancelledCount = 0;

/* ================= CITY SEARCH ================= */

cityQuery: string = '';
citySuggestions: any[] = [];
private citySearchTimeout: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {

    const user = await this.authService.getCurrentUser();
    if (!user) return;

    this.currentUid = user.uid;
    this.role = await this.authService.getUserRole(user.uid);

    if (this.role === 'driver') {
      await this.loadDriverProfile(user.uid);
      await this.loadDriverStats(user.uid);
      this.loadPendingRequests(user.uid);
      this.loadAcceptedRides(user.uid);
    }

  if (!user) return;

  this.driverRating = await this.getDriverRating(user.uid);
  }

  /* ================= LOAD PROFILE ================= */

  async loadDriverProfile(uid: string) {

    const userRef = doc(this.db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {

      const data = snapshot.data();

      this.driverProfile = {
  name: data['name'] || '',
  email: data['email'] || '',
  photoUrl: data['photoUrl'] || '',
  city: data['city'] || '',
  lat: data['lat'] || null,
  lng: data['lng'] || null,
  drivingStartDate: data['drivingStartDate'] || '',
  vehicles: data['vehicles'] || [],
  defaultVehicle: data['defaultVehicle'] || null
};
      this.calculateExperience();

    } else {

      await setDoc(userRef, {
        name: '',
        email: '',
        role: 'driver',
        photoUrl: '',
        drivingStartDate: '',
        vehicles: [],
        defaultVehicle: null
      });

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

  return {
    avg: count > 0 ? (total / count).toFixed(1) : 0,
    count: count
  };
}
  /* ================= EXPERIENCE (YEARS + MONTHS) ================= */

  calculateExperience() {

    if (!this.driverProfile.drivingStartDate) {
      this.experienceYears = 0;
      this.experienceText = '';
      return;
    }

    const start = new Date(this.driverProfile.drivingStartDate);
    const today = new Date();

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    this.experienceYears = years;
    this.experienceText = `${years} years ${months} months`;
  }


  async getCityCoordinates(city: string) {

  try {

    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: city,
          format: 'json',
          limit: 1
        }
      }
    );

    if (response.data.length > 0) {

      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };

    }

  } catch (error) {

    console.error("City coordinate error:", error);

  }

  return null;
}

/* ================= CITY SEARCH (OPENSTREETMAP) ================= */

async searchCity(query: string) {

  if (query.length < 3) {
    this.citySuggestions = [];
    return;
  }

  clearTimeout(this.citySearchTimeout);

  this.citySearchTimeout = setTimeout(async () => {

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

      this.citySuggestions = response.data;

    } catch (error) {
      console.error("City search error:", error);
    }

  }, 400);

}

selectCity(city: any) {

  this.cityQuery = city.display_name;

  this.driverProfile.city = city.display_name;
  this.driverProfile.lat = parseFloat(city.lat);
  this.driverProfile.lng = parseFloat(city.lon);

  this.citySuggestions = [];
}
  /* ================= SAVE PROFILE ================= */

  async saveProfile() {

  try {

    const userRef = doc(this.db, 'users', this.currentUid);

    let coords = null;

    if (this.driverProfile.city) {
      coords = await this.getCityCoordinates(this.driverProfile.city);
    }

    await updateDoc(userRef, {
  name: this.driverProfile.name || '',
  city: this.driverProfile.city || '',
  lat: this.driverProfile.lat || null,
  lng: this.driverProfile.lng || null,
  drivingStartDate: this.driverProfile.drivingStartDate || '',
  vehicles: this.driverProfile.vehicles || [],
  defaultVehicle: this.driverProfile.defaultVehicle || null
});

    alert("Profile updated successfully ✅");

  } catch (error) {

    console.error(error);
    alert("Error saving profile");

  }
}

  /* ================= ADD VEHICLE ================= */

  addVehicle() {

  if (!this.selectedCategory) return;

  const vehicleName =
    this.selectedBrand === 'Other' || this.selectedCategory === 'Other'
      ? this.customVehicleName?.trim()
      : this.selectedBrand?.trim();

  if (!vehicleName || !this.vehicleYear || !this.vehicleSeats) {
    alert("Please fill all vehicle details");
    return;
  }

  // 🔥 Ensure vehicles array exists
  if (!this.driverProfile.vehicles) {
    this.driverProfile.vehicles = [];
  }

  // 🔥 CHECK FOR DUPLICATE
  const isDuplicate = this.driverProfile.vehicles.some((v: any) =>
    v.category === this.selectedCategory &&
    v.name.toLowerCase() === vehicleName.toLowerCase() &&
    Number(v.year) === Number(this.vehicleYear)
  );

  if (isDuplicate) {
    alert("This vehicle is already added 🚫");
    return;
  }

  // ✅ ADD VEHICLE
  this.driverProfile.vehicles.push({
    category: this.selectedCategory,
    name: vehicleName,
    year: this.vehicleYear,
    seats: this.vehicleSeats
  });

  // Reset form
  this.selectedCategory = '';
  this.selectedBrand = '';
  this.customVehicleName = '';
  this.vehicleYear = null;
  this.vehicleSeats = null;
}

  /* ================= DRIVER STATS ================= */

 async loadDriverStats(uid: string) {

  const ridesQuery = query(
    collection(this.db, 'ride_requests'), // ✅ FIXED
    where('driverId', '==', uid)
  );

  const snapshot = await getDocs(ridesQuery);

  let total = 0;
  let rideCount = 0;

  this.rides = [];

  snapshot.forEach((doc: any) => {

    const data = doc.data();

    rideCount++;

    const earning = Number(data.driverAmount || data.fare || 0); // ✅ FIXED

    total += earning;

    this.rides.push({
      ...data,
      earning: earning
    });

  });

  this.totalEarnings = total;
  this.totalRides = rideCount;

  /* ===== RATING ===== */

  const ratingQuery = query(
    collection(this.db, 'ratings'),
    where('driverId', '==', uid)
  );

  const ratingSnap = await getDocs(ratingQuery);

  let ratingTotal = 0;
  let ratingCount = 0;

  ratingSnap.forEach(doc => {
    ratingTotal += Number(doc.data()['rating'] || 0);
    ratingCount++;
  });

  this.averageRating =
    ratingCount > 0
      ? Number((ratingTotal / ratingCount).toFixed(1))
      : 0;

  this.filteredRides = [...this.rides];

  this.calculateMonthlyEarnings();

  // ✅ FIX CHART RENDER TIMING
  setTimeout(() => {
    this.renderChart();
    this.calculateRideStatus();
    this.renderPieChart();
  }, 100);
}


  loadPendingRequests(uid: string) {

    const q = query(
      collection(this.db, 'ride_requests'),
      where('driverId', '==', uid),
      where('status', '==', 'pending')
    );

    onSnapshot(q, snapshot => {

      this.pendingRequests = [];

      snapshot.forEach(doc => {
        this.pendingRequests.push({
          id: doc.id,
          ...doc.data()
        });
      });

    });
  }


  loadAcceptedRides(uid: string) {

  const q = query(
    collection(this.db, 'ride_requests'),
    where('driverId', '==', uid),
    where('status', 'in', ['accepted','started'])
  );

  onSnapshot(q, snapshot => {

    this.acceptedRides = [];

    snapshot.forEach(doc => {

      this.acceptedRides.push({
        id: doc.id,
        ...doc.data()
      });

    });

  });

}
  async acceptRequest(request: any) {
  try {

    // ✅ 1. CALL BACKEND
    await axios.post('http://localhost:5000/api/driver/accept-request', {
      requestId: request.id,
      rideId: request.rideId,
      passengerEmail: request.passengerEmail || '',
      data: request
    });

    // 🔥 2. IMPORTANT: UPDATE FIRESTORE
    await updateDoc(doc(this.db, 'ride_requests', request.id), {
      status: 'accepted',
      driverId: this.currentUid   // ✅ MUST ADD THIS
    });

    alert("Ride Accepted ✅");

  } catch (error) {
    alert("Error accepting ride");
  }
}

  async rejectRequest(request: any) {
    try {
      await axios.post('http://localhost:5000/api/driver/reject-request', {
        requestId: request.id,
        passengerEmail: request.passengerEmail || '',
        data: request
      });
      alert("Ride Rejected ❌");
    } catch (error) {
      alert("Error rejecting ride");
    }
  }

calculateRideStatus() {

  this.completedCount = 0;
  this.cancelledCount = 0;

  this.rides.forEach((r: any) => {

    if (r.status === 'completed') {
      this.completedCount++;
    }

    if (r.status === 'cancelled') {
      this.cancelledCount++;
    }

  });

}

renderPieChart() {

  if (!this.pieCanvas) return;

  if (this.pieChart) {
    this.pieChart.destroy();
  }

  const ctx = this.pieCanvas.nativeElement;

  this.pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Completed', 'Cancelled'],
      datasets: [{
        data: [this.completedCount, this.cancelledCount]
      }]
    },
    options: {
      responsive: true
    }
  });
}

onPhotoSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert("Only image files allowed");
    return;
  }

  this.selectedPhoto = file;

  // 🔥 Create Preview
  const reader = new FileReader();
  reader.onload = () => {
    this.previewUrl = reader.result as string;
  };
  reader.readAsDataURL(file);
}

async confirmUpload() {
  if (!this.selectedPhoto) return;

  try {

    const formData = new FormData();
    formData.append('photo', this.selectedPhoto);
    formData.append('uid', this.currentUid);

    const response = await fetch(
      'http://localhost:5000/api/auth/update-photo',
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const result = await response.json();

    if (result.photoUrl) {
      this.driverProfile.photoUrl = result.photoUrl;
      this.previewUrl = null;
      this.selectedPhoto = undefined as any;
    }

  } catch (error) {
    console.error(error);
    alert("Upload failed");
  }
}
async removePhoto() {
  try {

    const userRef = doc(this.db, 'users', this.currentUid);

    await updateDoc(userRef, { photoUrl: '' });

    this.driverProfile.photoUrl = '';
    this.previewUrl = null;

  } catch (error) {
    alert("Error removing photo");
  }
}
removeVehicle(index: number) {

  const removedVehicle = this.driverProfile.vehicles[index];

  this.driverProfile.vehicles.splice(index, 1);

  if (this.driverProfile.defaultVehicle === removedVehicle.name) {
    this.driverProfile.defaultVehicle = null;
  }
}

applyFilter(type: string) {

  this.selectedFilter = type;

  const now = new Date();

  if (type === '7') {
    this.filteredRides = this.rides.filter((r: any) =>
      new Date(r.createdAt?.seconds * 1000) >= new Date(now.getTime() - 7 * 86400000)
    );
  }
  else if (type === '30') {
    this.filteredRides = this.rides.filter((r: any) =>
      new Date(r.createdAt?.seconds * 1000) >= new Date(now.getTime() - 30 * 86400000)
    );
  }
  else {
    this.filteredRides = [...this.rides];
  }

  this.calculateMonthlyEarnings();
  this.renderChart();
}

calculateMonthlyEarnings() {

  const map: any = {};

  this.filteredRides.forEach(r => {

    if (!r.createdAt) return;

const date = new Date(r.createdAt.seconds * 1000);

    const key = date.toLocaleString('en-IN', {
      month: 'short',
      year: 'numeric'
    });

    if (!map[key]) map[key] = 0;

    map[key] += r.earning || 0;

  });

  this.monthlyEarnings = Object.keys(map).map(key => ({
    month: key,
    total: map[key]
  }));
}

renderChart() {

  if (this.chart) {
    this.chart.destroy();
  }

  const labels = this.monthlyEarnings.map(m => m.month);
  const data = this.monthlyEarnings.map(m => m.total);

  this.chart = new Chart('earningsChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Monthly Earnings',
        data: data
      }]
    },
    options: {
      responsive: true,
    }
  });
}

exportPDF() {

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Driver Earnings Report", 20, 20);

  let y = 40;

  this.monthlyEarnings.forEach(m => {
    doc.text(`${m.month}: ₹${m.total}`, 20, y);
    y += 10;
  });

  doc.save("earnings-report.pdf");
}


}
