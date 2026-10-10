const mail = require('../services/mail.service');
console.log('MAIL EXPORTS:', mail);

const express = require('express');
const router = express.Router();

const {
  sendRideRequestMailToDriver,
  sendRideDecisionMailToPassenger
} = require('../services/mail.service');

/* =====================================
   📧 Passenger → Driver
===================================== */
router.post('/ride-request', async (req, res) => {
  try {
    const { driverEmail, data } = req.body;

    await sendRideRequestMailToDriver(driverEmail, data);

    res.json({ success: true });
  } catch (err) {
    console.error('Ride request mail error:', err);
    res.status(500).json({ success: false });
  }
});

/* =====================================
   📧 Driver → Passenger
===================================== */
router.post('/ride-decision', async (req, res) => {
  try {
    const { passengerEmail, data } = req.body;

    await sendRideDecisionMailToPassenger(passengerEmail, data);

    res.json({ success: true });
  } catch (err) {
    console.error('Ride decision mail error:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
