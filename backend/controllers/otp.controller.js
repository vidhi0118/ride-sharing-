const { sendOtpMail } = require('../services/mail.service');

// Temporary in-memory OTP store (for demo)
// In production, store in DB / Redis
const otpStore = new Map();

// ==========================
// 🔐 SEND OTP
// ==========================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email missing'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 2 * 60 * 1000
    });

    await sendOtpMail(email, otp);

    console.log(`OTP sent to ${email}: ${otp}`);

    res.json({
      success: true
    });

  } catch (error) {
    console.error('SEND OTP ERROR:', error);
    res.status(500).json({ success: false });
  }
};
// ==========================
// ✅ VERIFY OTP
// ==========================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email or OTP missing'
      });
    }

    const record = otpStore.get(email);

    if (!record) {
      return res.json({ success: false });
    }

    // Expired
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.json({ success: false });
    }

    // ❌ Wrong OTP
    if (record.otp !== otp) {
      return res.json({ success: false });
    }

    //  SUCCESS
    otpStore.delete(email); //  FIXED (no uid)

    res.json({
      success: true
    });

  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    res.status(500).json({ success: false });
  }
};
