import { firebaseApp,db } from './../firebase/firebase.config';
import { Injectable } from '@angular/core';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class LiveLocationService {

  startTracking(driverId: string){

    setInterval(()=>{

      navigator.geolocation.getCurrentPosition(async(position)=>{

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        await updateDoc(
          doc(db,"users",driverId),
          {
            lat: lat,
            lng: lng,
            updatedAt: new Date()
          }
        );

      });

    },15000); // 15 sec

  }

  listenDriver(driverId:string,callback:any){

    const driverRef = doc(db,"users",driverId);

    onSnapshot(driverRef,(snapshot)=>{

      const data:any = snapshot.data();

      if(!data) return;

      callback(data.lat,data.lng);

    });

  }

}
