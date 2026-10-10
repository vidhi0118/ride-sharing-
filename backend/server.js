require('dotenv').config();

const cron = require('node-cron');
const admin = require('firebase-admin');
const { db } = require('./firebase/firebase.config');
const { sendRideDecisionMailToPassenger } = require('./services/mail.service');

const express = require('express');
const cors = require('cors');

const multer = require('multer');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const otpRoutes = require('./routes/otp.routes');
const notificationRoutes = require('./routes/notification.routes');
const driverRoutes = require('./routes/driver.routes');
const rideRoutes = require('./routes/ride.routes');
const { refundPayment } = require('./services/payment.service');
const app = express();

app.use(cors());
app.use(express.json());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/driver', driverRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/rides', rideRoutes);
// Health check
app.get('/', (req, res) => {
  res.send('Backend is running');
});
/* ============================================================

AUTO EXPIRE PENDING REQUESTS AFTER 6 HOURS
============================================================ */

cron.schedule('*/10 * * * *', async () => {
  console.log("Running auto-expire check...");

  try {

    const sixHoursAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 6 * 60 * 60 * 1000)
    );

    const snapshot = await db
      .collection('ride_requests')
      .where('status', '==', 'pending')
      .where('createdAt', '<=', sixHoursAgo)
      .get();

    for (const doc of snapshot.docs) {

      const data = doc.data();

//  Refund if payment exists
if (data.paymentId) {
  await refundPayment(data.paymentId);
}

//  Update status
await doc.ref.update({
  status: 'expired',
  paymentStatus: 'refunded'
});
      //  Send email
      if (data.passengerEmail) {
        await sendRideDecisionMailToPassenger(
          data.passengerEmail,
          {
            ...data,
            status: 'expired'
          }
        );
      }

      // Create notification
      await db.collection('notifications').add({
  passengerId: data.passengerId,
  driverName: data.driverName || '',
  from: data.from,
  to: data.to,
  status: 'accepted', // or rejected / expired
  type: 'RIDE_UPDATE',
  createdAt: admin.firestore.Timestamp.now(),
  read: false
});

await db.collection('notifications').add({
  driverId,
  type: 'NEW_RIDE_REQUEST',
  message: 'You have a new ride request',
  requestId: requestRef.id,
  createdAt: admin.firestore.Timestamp.now(),
  read: false
});

      console.log(`Expired request: ${doc.id}`);
    }

  } catch (err) {
    console.error("Auto-expire error:", err);
  }

});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
