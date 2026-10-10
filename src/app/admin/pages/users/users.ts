import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

interface Vehicle {
  category: string;
  name: string;
  seats: number;
  year: number;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'passenger' | 'driver';
  aadhaarVerified: boolean;
  drivingStartDate?: string;
  photoUrl?: string;
  defaultVehicle?: string;
  vehicles?: Vehicle[];
}

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class Users implements OnInit {

  passengers: AppUser[] = [];
  drivers: AppUser[] = [];

  activeTab: 'passenger' | 'driver' = 'passenger';
  selectedUser: AppUser | null = null;

  async ngOnInit() {
    const snap = await getDocs(collection(db, 'users'));

    snap.docs.forEach(d => {
      const data = d.data() as Omit<AppUser, 'id'>;

      if (data.role === 'passenger' || data.role === 'driver') {
        const user: AppUser = {
          id: d.id,
          ...data
        };

        if (user.role === 'passenger') {
          this.passengers.push(user);
        } else {
          this.drivers.push(user);
        }
      }
    });
  }

  openDetails(user: AppUser) {
    this.selectedUser = user;
  }

  closeDetails() {
    this.selectedUser = null;
  }

  calculateExperience(startDate?: string): number {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date();
    return today.getFullYear() - start.getFullYear();
  }

  async deleteUser(userId: string) {
    const confirmDelete = confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    await deleteDoc(doc(db, 'users', userId));

    this.passengers = this.passengers.filter(u => u.id !== userId);
    this.drivers = this.drivers.filter(u => u.id !== userId);

    this.selectedUser = null;
  }
}
