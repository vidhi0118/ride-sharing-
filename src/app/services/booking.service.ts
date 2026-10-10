import { Injectable } from '@angular/core';

export interface RideRequest {
  id: number;
  rideId: number;
  passengerId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requestedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private requests: RideRequest[] = [];
  private requestIdCounter = 1;

  requestRide(rideId: number, passengerId: number) {
    const request: RideRequest = {
      id: this.requestIdCounter++,
      rideId,
      passengerId,
      status: 'PENDING',
      requestedAt: new Date()
    };

    this.requests.push(request);
    return request;
  }

  getRequests() {
    return this.requests;
  }
}
