const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendOTP(email, otp) {
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },

    body: JSON.stringify({
      sender: {
        name: "mairoChat",
        email: process.env.EMAIL_USER,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: "Your mairoChat Verification OTP",

      textContent: `Your verification OTP is ${otp}. It is valid for 10 minutes. Do not share this OTP with anyone.`,

      htmlContent: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: 30px auto;
          padding: 25px;
          border: 1px solid #ddd;
          border-radius: 12px;
        ">
          <h2>mairoChat</h2>

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
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Brevo email error:", data);

    throw new Error(
      data?.message || "Failed to send verification email"
    );
  }

  console.log("OTP email sent successfully:", data.messageId);

  return data;
}

module.exports = { sendOTP };