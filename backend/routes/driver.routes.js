const express = require('express');
const router = express.Router();

const admin = require('firebase-admin');
const { db } = require('../firebase/firebase.config');

const {
  sendRideDecisionMailToPassenger
} = require('../services/mail.service');

/* ============================================================
   🔍 GET DRIVERS FROM USERS COLLECTION
============================================================ */

router.get('/list', async (req, res) => {
  try {

    const { vehicle, fromDate, toDate } = req.query;

    const snapshot = await db
      .collection('users')
      .where('role', '==', 'driver')
      .get();

    const drivers = [];

    for (const doc of snapshot.docs) {

      const data = doc.data();

      // 🔥 Vehicle filter (optional)
      if (vehicle && data.vehicles?.length) {
        const match = data.vehicles.some(v =>
          v.category === vehicle
        );
        if (!match) continue;
      }

      // 🔥 If NO date filter → show driver immediately
      if (!fromDate) {
        drivers.push({
          id: doc.id,
          name: data.name || '',
          photoUrl: data.photoUrl || '',
          rating: data.rating || 0,
          drivingStartDate: data.drivingStartDate || '',
          vehicles: data.vehicles || [],
          defaultVehicle: data.defaultVehicle || null
        });
        continue;
      }

      // 🔥 Date filter applied
      const bookingSnapshot = await db
        .collection('bookings')
        .where('driverId', '==', doc.id)
        .where('status', '==', 'booked')
        .get();

      let isAvailable = true;

      bookingSnapshot.forEach(b => {

        const booking = b.data();

        // Skip old bookings without dates
        if (!booking.fromDate || !booking.toDate) return;

        const existingFrom = booking.fromDate;
        const existingTo = booking.toDate;

        const requestedFrom = fromDate;
        const requestedTo = toDate || fromDate;

        if (
          requestedFrom <= existingTo &&
          requestedTo >= existingFrom
        ) {
          isAvailable = false;
        }
      });

      if (!isAvailable) continue;

      drivers.push({
        id: doc.id,
        name: data.name || '',
        photoUrl: data.photoUrl || '',
        rating: data.rating || 0,
        drivingStartDate: data.drivingStartDate || '',
        vehicles: data.vehicles || [],
        defaultVehicle: data.defaultVehicle || null
      });
    }

    res.json({ success: true, drivers });

  } catch (err) {
    console.error("Driver list error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ============================================================
   📝 CREATE RIDE REQUEST (VALIDATED)
============================================================ */
router.post('/create-request', async (req, res) => {
  try {

    const {
      passengerId,
      driverId,
      fromDate,
      toDate
    } = req.body;

    if (!passengerId || !driverId || !fromDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // 🔥 CHECK EXISTING PENDING REQUEST
    const existing = await db.collection('ride_requests')
      .where('passengerId', '==', passengerId)
      .where('driverId', '==', driverId)
      .where('status', '==', 'pending')
      .get();

    if (!existing.empty) {
      return res.json({
        success: false,
        error: "You already sent a pending request to this driver"
      });
    }

    const requestRef = await db.collection('ride_requests').add({
      ...req.body,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now()
    });

    // 🔔 Notification
    await db.collection('notifications').add({
      driverId,
      type: 'NEW_RIDE_REQUEST',
      message: 'You have a new ride request',
      requestId: requestRef.id,
      createdAt: admin.firestore.Timestamp.now(),
      read: false
    });

    res.json({
      success: true,
      requestId: requestRef.id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


/* ============================================================
   ✅ ACCEPT RIDE REQUEST (TRANSACTION SAFE)
============================================================ */
router.post('/accept-request', async (req, res) => {
  try {

    const { requestId, passengerEmail, data } = req.body;

    if (!requestId || !data) {
      return res.status(400).json({
        success: false,
        error: "Missing required data"
      });
    }

    await db.runTransaction(async (transaction) => {

  const requestRef = db.collection('ride_requests').doc(requestId);
  const requestDoc = await transaction.get(requestRef);

  if (!requestDoc.exists) {
    throw new Error("Ride request not found");
  }

  if (requestDoc.data().status !== 'pending') {
    throw new Error("Request already processed");
  }

  // Update request
  transaction.update(requestRef, {
    status: 'accepted'
  });

  // Create booking
  const bookingRef = db.collection('bookings').doc();

  transaction.set(bookingRef, {
    passengerId: data.passengerId,
    driverId: data.driverId,

    from: data.from,
    to: data.to,

    status: 'booked',

    price: data.price || 200,

    bookedAt: admin.firestore.Timestamp.now(),

    rideDate: data.rideDate || null,
    rideTime: data.rideTime || null,

    fromDate: data.fromDate || null,
    toDate: data.toDate || null
  });

});

    // 📧 Send Email
    await sendRideDecisionMailToPassenger(passengerEmail, {
      ...data,
      status: 'accepted'
    });

    // 🔔 Create Notification
    await db.collection('notifications').add({
      passengerId: data.passengerId,
      type: 'RIDE_ACCEPTED',
      message: 'Your ride request has been accepted',
      createdAt: admin.firestore.Timestamp.now(),
      read: false
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ============================================================
   ❌ REJECT RIDE REQUEST (SAFE)
============================================================ */
router.post('/reject-request', async (req, res) => {
  try {

    const { requestId, passengerEmail, data } = req.body;

    if (!requestId || !data) {
      return res.status(400).json({
        success: false,
        error: "Missing required data"
      });
    }

    const requestRef = db.collection('ride_requests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Ride request not found"
      });
    }

    if (requestDoc.data().status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: "Request already processed"
      });
    }

    await requestRef.update({
      status: 'rejected'
    });

    // 📧 Email
    await sendRideDecisionMailToPassenger(passengerEmail, {
      ...data,
      status: 'rejected'
    });

    // 🔔 Passenger Notification
    await db.collection('notifications').add({
      passengerId: data.passengerId,
      type: 'RIDE_REJECTED',
      message: 'Your ride request was rejected',
      createdAt: admin.firestore.Timestamp.now(),
      read: false
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ============================================================
   🚗 START RIDE
============================================================ */
router.post('/start-ride', async (req, res) => {

  try {

    const { requestId, passengerEmail, data } = req.body;

    if (!requestId || !data) {
      return res.status(400).json({
        success: false,
        error: "Missing required data"
      });
    }

    const requestRef = db.collection('ride_requests').doc(requestId);

    await requestRef.update({
      status: 'started',
      paymentStatus: 'paid',
      startedAt: admin.firestore.Timestamp.now()
    });

    // 🔔 Notification
    await db.collection('notifications').add({
      passengerId: data.passengerId,
      type: 'RIDE_STARTED',
      message: 'Your ride has started',
      createdAt: admin.firestore.Timestamp.now(),
      read: false
    });

    res.json({ success: true });

  } catch (err) {

    console.error("Start ride error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

/* ============================================================
   🏁 COMPLETE RIDE
============================================================ */
router.post('/complete-ride', async (req, res) => {

  try {

    const { requestId, passengerEmail, data } = req.body;

    if (!requestId || !data) {
      return res.status(400).json({
        success: false,
        error: "Missing required data"
      });
    }

    const requestRef = db.collection('ride_requests').doc(requestId);

    await requestRef.update({
      status: 'completed',
      completedAt: admin.firestore.Timestamp.now()
    });

    // 📧 Email
    await sendRideDecisionMailToPassenger(passengerEmail,{
      ...data,
      status:'completed'
    });

    // 🔔 Notification
    await db.collection('notifications').add({
      passengerId: data.passengerId,
      type: 'RIDE_COMPLETED',
      message: 'Your ride has been completed',
      createdAt: admin.firestore.Timestamp.now(),
      read: false
    });

    res.json({ success: true });

  } catch (err) {

    console.error("Complete ride error:", err);

    res.status(500).json({
      success:false,
      error:err.message
    });

  }

});
module.exports = router;
