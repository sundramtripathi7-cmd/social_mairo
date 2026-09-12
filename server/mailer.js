const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: `"Messaging App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Messaging App Verification OTP",
    text: `Your verification OTP is ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Messaging App</h2>
        <p>Your email verification OTP is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 15px;
          background: #f2f2f2;
          text-align: center;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>Do not share this OTP with anyone.</p>
      </div>
    `,
  });
}

module.exports = { sendOTP };