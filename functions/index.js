const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// 🔐 Runtime config (works on Spark plan)
const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.pass;

// 📧 LoadMailer (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: vidhi0118ptl@gmail.com,
    pass: hzdqjmzeokakfrku
  }
});

// 🚗 Trigger when booking is created
exports.sendDriverEmailOnBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {

    const booking = snap.data();

    if (!booking || !booking.driverId) {
      console.log('Invalid booking data');
      return;
    }

    const driverSnap = await admin
      .firestore()
      .collection('users')
      .doc(booking.driverId)
      .get();

    if (!driverSnap.exists) {
      console.log('Driver not found');
      return;
    }

    const driver = driverSnap.data();

    const mailOptions = {
      from: `Smart RideShare <${gmailEmail}>`,
      to: driver.email,
      subject: '🚗 New Ride Booking',
      html: `
        <h3>Hello ${driver.name},</h3>
        <p>A passenger has booked your ride.</p>
        <p><b>Route:</b> ${booking.from} → ${booking.to}</p>
        <p>Please check your dashboard.</p>
        <br/>
        <p>— Smart RideShare Team</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent to:', driver.email);
    } catch (err) {
      console.error('❌ Email error:', err);
    }
  });
