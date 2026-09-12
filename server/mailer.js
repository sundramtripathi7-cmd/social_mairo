const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTP(email, otp) {
  const { data, error } = await resend.emails.send({
    from: "Messaging App <onboarding@resend.dev>",
    to: [email],
    subject: "Your Messaging App Verification OTP",

    text: `Your verification OTP is ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone.`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: 30px auto;
        padding: 25px;
        border: 1px solid #ddd;
        border-radius: 12px;
      ">
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
          border-radius: 8px;
        ">
          ${otp}
        </div>

        <p>
          This OTP is valid for <strong>10 minutes</strong>.
        </p>

        <p>
          Do not share this OTP with anyone.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(error.message || "Failed to send email");
  }

  console.log("OTP email sent successfully:", data?.id);

  return data;
}

module.exports = { sendOTP };