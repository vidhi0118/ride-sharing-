const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { db } = require('../firebase/firebase.config');
const { createOrder, refundPayment ,verifyPayment} = require('../services/payment.service');
/* =========================================
   🚗 CREATE RIDE REQUEST
========================================= */
router.post('/book', async (req, res) => {
  try {

    const {
      passengerId,
      passengerEmail,
      driverId,
      driverName,
      from,
      to,
      fare,
       rideDate,
  rideTime,
      paymentType
    } = req.body;

    // ✅ SAFE VALUES
    const safeFare = Number(fare);

    if (!safeFare || isNaN(safeFare)) {
      return res.json({
        success: false,
        message: "Invalid fare received"
      });
    }

    const payableAmount =
      paymentType === 50 ? safeFare * 0.5 : safeFare;

    const rideRef = await db.collection('ride_requests').add({
      passengerId: passengerId || "",
      passengerEmail: passengerEmail || "",

      driverId: driverId || "not_assigned",
      driverName: driverName || "Unknown",

      from: from || "",
      to: to || "",

      fare: safeFare,
      paymentType: paymentType || 100,
      payableAmount,
      rideDate: rideDate || "",
rideTime: rideTime || "",
      status: 'pending',
      paymentStatus: 'pending',

      createdAt: admin.firestore.Timestamp.now()
    });

    res.json({
      success: true,
      rideId: rideRef.id,
      payableAmount
    });

  } catch (err) {
    console.error("BOOK ERROR:", err);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

/* =========================================
   💳 PAYMENT SUCCESS
========================================= */
router.post('/payment-success', async (req, res) => {
  try {
    const {
      rideId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    // 🔐 VERIFY PAYMENT
    const isValid = verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature ❌"
      });
    }

    // ✅ PAYMENT VERIFIED
    await db.collection('ride_requests').doc(rideId).update({
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'pending'
    });

    res.json({
      success: true,
      message: "Payment verified & ride confirmed ✅"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

/* =========================================
   ✅ DRIVER ACCEPT
========================================= */
router.post('/accept', async (req, res) => {
  try {
    const { rideId, driverId } = req.body;

    await db.collection('ride_requests').doc(rideId).update({
      status: 'accepted',
      driverId,
      acceptedAt: admin.firestore.Timestamp.now()
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: 'Accept failed' });
  }
});

/* =========================================
   ❌ DRIVER REJECT (WITH REFUND)
========================================= */
router.post('/reject', async (req, res) => {
  try {
    const { rideId } = req.body;

    const rideRef = db.collection('ride_requests').doc(rideId);
    const ride = (await rideRef.get()).data();

    // 🔁 Refund via Razorpay
    if (ride.paymentId) {
      await refundPayment(ride.paymentId);
    }

    await rideRef.update({
      status: 'rejected',
      paymentStatus: 'refunded'
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reject failed' });
  }
});

/* =========================================
   🏁 COMPLETE RIDE (SPLIT MONEY)
========================================= */
router.post('/complete', async (req, res) => {
  try {
    const { rideId } = req.body;

    const rideRef = db.collection('ride_requests').doc(rideId);
    const ride = (await rideRef.get()).data();

    const total = ride.fare;

    const driverAmount = total * 0.8;
    const adminAmount = total * 0.2;

    await rideRef.update({
  status: 'completed',
  paymentStatus: 'paid',
  driverAmount,
  adminAmount
});

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: 'Complete failed' });
  }
});

/* =========================================
   💳 CREATE PAYMENT ORDER
========================================= */
router.post('/create-order', async (req, res) => {
  try {
    const { rideId } = req.body;

    const ride = (await db.collection('ride_requests').doc(rideId).get()).data();

    const order = await createOrder(ride.payableAmount);

    res.json({
      success: true,
      order
    });

  } catch (err) {
    res.status(500).json({ error: 'Order creation failed' });
  }
});

module.exports = router;
