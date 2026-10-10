const admin = require('../firebase/firebaseAdmin');
const { sendDriverBookingMail } = require('../services/mail.service');

exports.notifyDriver = async (req, res) => {
  try {
    const { driverId, from, to } = req.body;

    if (!driverId) {
      return res.status(400).json({ message: 'driverId required' });
    }

    const driverSnap = await admin
      .firestore()
      .collection('users')
      .doc(driverId)
      .get();

    if (!driverSnap.exists) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driver = driverSnap.data();

    await sendDriverBookingMail(
      driver.email,
      driver.name,
      { from, to }
    );

    res.json({ message: 'Email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Email failed' });
  }
};
