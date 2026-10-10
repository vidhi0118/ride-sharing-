import { Injectable } from '@angular/core';
import { db, auth } from '../firebase/firebase.config';
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class RideRequestService {

  async sendRequest(rideId: string, driverId: string, passengerName: string) {
    return addDoc(collection(db, 'ride_requests'), {
      rideId,
      driverId,
      passengerId: auth.currentUser?.uid,
      passengerName,
      status: 'pending',
      requestedAt: Timestamp.now()
    });
  }

  async getPendingRequestsForDriver() {
    const q = query(
      collection(db, 'ride_requests'),
      where('driverId', '==', auth.currentUser?.uid),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  acceptRequest(id: string) {
    return updateDoc(doc(db, 'ride_requests', id), { status: 'accepted' });
  }

  rejectRequest(id: string) {
    return updateDoc(doc(db, 'ride_requests', id), { status: 'rejected' });
  }
}
