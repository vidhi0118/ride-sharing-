const express = require('express');
const router = express.Router();
const { sendWelcomeMail } = require('../services/mail.service');

const multer = require('multer');
const path = require('path');

const admin = require('firebase-admin');
const { db } = require('../firebase/firebase.config');

/* ================================
   MULTER CONFIGURATION
================================ */

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

/* ================================
   REGISTER WITH PHOTO + CREATE USER
================================ */

router.post('/register-with-photo', upload.single('photo'), async (req, res) => {
  try {

    const { name, email, role, uid } = req.body;
    const photoFile = req.file ? req.file.filename : null;

    if (!name || !email || !uid) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const photoUrl = photoFile
      ? `http://localhost:5000/uploads/${photoFile}`
      : '';

    await db.collection('users').doc(uid).set({
      name,
      email,
      role,
      photoUrl,
      drivingStartDate: '',
      vehicles: [],
      defaultVehicle: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await sendWelcomeMail(email, name, role);

    res.json({
      message: "User registered successfully",
      photoUrl
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});


/* ================================
   UPDATE PROFILE PHOTO
================================ */

router.post('/update-photo', upload.single('photo'), async (req, res) => {
  try {

    console.log("🔥 Update Photo Route Hit");

    const { uid } = req.body;
    const photoFile = req.file ? req.file.filename : null;

    console.log("UID:", uid);
    console.log("File:", photoFile);

    if (!uid || !photoFile) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const photoUrl = `http://localhost:5000/uploads/${photoFile}`;

    await db.collection('users').doc(uid).update({
      photoUrl: photoUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("✅ Firestore Updated");

    res.json({ photoUrl });

  } catch (error) {
    console.error("❌ Update Photo Error:", error);
    res.status(500).json({ message: "Photo update failed" });
  }
});


/* ================================
   WELCOME EMAIL (Optional)
================================ */

router.post('/welcome', async (req, res) => {
  try {

    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    await sendWelcomeMail(email, name, role);

    res.json({ message: 'Welcome email sent' });

  } catch (err) {
    console.error("Welcome Email Error:", err);
    res.status(500).json({ message: 'Email failed' });
  }
});

/* ================================
   RESET PASSWORD
================================ */

router.post('/reset-password', async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // 🔍 get user by email
    const user = await admin.auth().getUserByEmail(email);

    // 🔐 update password
    await admin.auth().updateUser(user.uid, {
      password: password
    });

    console.log("✅ Password updated for:", email);

    res.json({ success: true });

  } catch (err) {
    console.error("❌ RESET PASSWORD ERROR:", err);
    res.status(500).json({ success: false });
  }
});
module.exports = router;
