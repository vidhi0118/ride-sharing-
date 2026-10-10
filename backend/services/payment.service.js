const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* =========================================
   🧾 CREATE ORDER
========================================= */
const createOrder = async (amount) => {
  return await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR"
  });
};

/* =========================================
   💸 REFUND PAYMENT
========================================= */
const refundPayment = async (paymentId) => {
  return await razorpay.payments.refund(paymentId);
};

/* =========================================
   🔐 VERIFY PAYMENT
========================================= */
const verifyPayment = (orderId, paymentId, signature) => {

  const body = orderId + "|" + paymentId;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

/* =========================================
   EXPORTS (ALWAYS AT BOTTOM)
========================================= */
module.exports = {
  createOrder,
  refundPayment,
  verifyPayment
};
