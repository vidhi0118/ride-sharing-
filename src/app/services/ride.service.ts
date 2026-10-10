import { Injectable } from '@angular/core';
import { db, auth } from '../firebase/firebase.config';
import {
  addDoc,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class RideService {

  // 🚗 DRIVER: Add a ride
  async addRide(rideData: any) {
    return addDoc(collection(db, 'rides'), {
      ...rideData,
      driverId: auth.currentUser?.uid,
      driverName: rideData.driverName || 'Driver',
      status: 'active',
      createdAt: Timestamp.now()
    });
  }

  // 👥 PASSENGER: Get all rides (optional/admin use)
  getAllRides() {
    return getDocs(collection(db, 'rides'));
  }

  // 🎫 BOOKING: Reduce seat count
  reduceSeat(rideId: string, currentSeats: number) {
    return updateDoc(doc(db, 'rides', rideId), {
      seats: currentSeats - 1
    });
  }

  // 🔍 PASSENGER: Get matching rides based on search
  async getMatchingRides(filters: any) {
    const ridesRef = collection(db, 'rides');

    const q = query(
      ridesRef,
      where('fromDistrict', '==', filters.fromDistrict),
      where('toDistrict', '==', filters.toDistrict),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }
}
