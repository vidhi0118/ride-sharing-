
const nodemailer = require('nodemailer');

/* ======================================================
   🔧 Create Transporter (Safe & Dynamic)
====================================================== */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASS
    }
  });
}

/* ======================================================
   🚗 Driver Booking Mail
====================================================== */
exports.sendDriverBookingMail = async (to, name, data) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Smart RideShare" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject: 'New Ride Booking – Smart RideShare',
      html: `
        <h3>Hello ${name},</h3>
        <p>You have received a new ride booking.</p>

        <h4>Passenger Details</h4>
        <p>
          Name: ${data.passengerName}<br/>
          Email: ${data.passengerEmail}
        </p>

        <h4>Ride Details</h4>
        <p>
          Route: ${data.from} → ${data.to}<br/>
          Date: ${data.rideDate}<br/>
          Time: ${data.rideTime}
        </p>

        <p>– Smart RideShare Team</p>
      `
    });

  } catch (err) {
    console.error("Driver booking mail error:", err.message);
  }
};

/* ======================================================
   🎉 Welcome Mail
====================================================== */
exports.sendWelcomeMail = async (to, name, role) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Smart RideShare" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject: 'Welcome to Smart RideShare 🚗',
      html: `
        <h2>Welcome ${name}!</h2>
        <p>You registered as <b>${role}</b>.</p>
        <p>– Smart RideShare Team</p>
      `
    });

  } catch (err) {
    console.error("Welcome mail error:", err.message);
  }
};

/* ======================================================
   🔐 OTP MAIL
====================================================== */
exports.sendOtpMail = async (to, otp) => {
  try {
    console.log("📧 Sending OTP to:", to);   // ✅ DEBUG

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Smart RideShare" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject: 'Your OTP Code – Smart RideShare',
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>Valid for 2 minutes.</p>
      `
    });

    console.log("✅ OTP email sent successfully");

  } catch (err) {
    console.error("❌ OTP mail error:", err.message);

    throw err;   // 🔥 VERY IMPORTANT (ADD THIS)
  }
};

/* ======================================================
   📧 DRIVER – Ride Request Email
====================================================== */
exports.sendRideRequestMailToDriver = async (to, data) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Smart RideShare" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject: '🚗 New Ride Booking Request',
      html: `
        <h2>New Ride Request</h2>
        <p><b>Passenger:</b> ${data.passengerName}</p>
        <p><b>Route:</b> ${data.from} → ${data.to}</p>
        <p><b>Date:</b> ${data.rideDate}</p>
        <p><b>Time:</b> ${data.rideTime}</p>
      `
    });

  } catch (err) {
    console.error("Driver ride request mail error:", err.message);
  }
};

/* ======================================================
   📧 PASSENGER – Ride Decision Mail
====================================================== */
exports.sendRideDecisionMailToPassenger = async (to, data) => {

  try {

    const transporter = createTransporter();

    let subject = "";
    let html = "";

    /* ================= STATUS LOGIC ================= */

    if(data.status === 'accepted'){

      subject = "✅ Ride Confirmed";

      html = `
        <h2>Ride Confirmed</h2>
        <p><b>Route:</b> ${data.from} → ${data.to}</p>
        <p><b>Date:</b> ${data.rideDate || ''}</p>
        <p><b>Time:</b> ${data.rideTime || ''}</p>

        <p>Your ride is confirmed. Have a safe journey! 🚗</p>

        <p>– Smart RideShare Team</p>
      `;

    }

    else if(data.status === 'expired'){

      subject = "⏰ Ride Request Expired";

      html = `
        <h2>Ride Request Expired</h2>

        <p><b>Route:</b> ${data.from} → ${data.to}</p>

        <p>Driver did not respond within 6 hours. Please try another driver.</p>

        <p>– Smart RideShare Team</p>
      `;

    }

    else if(data.status === 'rejected'){

      subject = "❌ Ride Request Rejected";

      html = `
        <h2>Ride Request Rejected</h2>

        <p><b>Route:</b> ${data.from} → ${data.to}</p>

        <p>Unfortunately, the driver rejected your request.</p>

        <p>– Smart RideShare Team</p>
      `;

    }

    else if(data.status === 'completed'){

      subject = "🚗 Ride Completed Successfully";

      html = `
        <h2>Ride Completed</h2>

        <p><b>Route:</b> ${data.from} → ${data.to}</p>

        <p>Your trip has successfully reached the destination.</p>

        <p>Thank you for riding with Smart RideShare.</p>

        <p>– Smart RideShare Team</p>
      `;

    }

    /* ================= SEND EMAIL ================= */

    await transporter.sendMail({
      from: `"Smart RideShare" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject,
      html
    });

  }

  catch (err) {

    console.error("Passenger decision mail error:", err.message);

  }

};
