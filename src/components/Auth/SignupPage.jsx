import { useEffect, useState } from "react";

function SignupPage({ setPage, apiUrl }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  async function sendOTP() {
    setError("");

    if (!email) {
      setError("Please enter your college email.");
      return;
    }

    if (!email.toLowerCase().endsWith("@iiitvadodara.ac.in")) {
      setError(
        "Only IIIT Vadodara college email is allowed."
      );
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      setOtpSent(true);
      setOtpVerified(false);
      setTimer(60);

      alert("OTP sent to your college email.");
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOTP() {
    setError("");

    if (!otp) {
      setError("Please enter OTP.");
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      setOtpVerified(true);
      setError("");

      alert("Email verified successfully.");
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    }
  }

  async function handleSignup() {
    setError("");

    if (!username || !email || !password || !gender) {
      setError("Please fill all fields.");
      return;
    }

    if (!otpVerified) {
      setError("Please verify your email first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            gender,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      sessionStorage.setItem(
        "token",
        data.token
      );

      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setPage("chat");
    } catch (error) {
      console.error(error);
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSignup();
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          💬
        </div>

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Join the conversation
        </p>

        <form>
          <label>Username</label>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="your@iiitvadodara.ac.in"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setOtpSent(false);
              setOtpVerified(false);
            }}
            onKeyDown={handleKeyDown}
          />

          <button
            type="button"
            className="secondary-btn"
            onClick={sendOTP}
            disabled={
              otpLoading || timer > 0
            }
          >
            {otpLoading
              ? "Sending..."
              : timer > 0
              ? `Resend OTP (${timer}s)`
              : "Send OTP"}
          </button>

          {otpSent && (
            <>
              <label>OTP</label>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
                maxLength={6}
                onKeyDown={handleKeyDown}
              />

              <button
                type="button"
                className="secondary-btn"
                onClick={verifyOTP}
                disabled={otpVerified}
              >
                {otpVerified
                  ? "Email Verified ✓"
                  : "Verify OTP"}
              </button>
            </>
          )}

          <label>Password</label>

          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />

          <label>Gender</label>

          <select
            value={gender}
            onChange={(e) =>
              setGender(e.target.value)
            }
          >
            <option value="">
              Select gender
            </option>

            <option value="male">
              Male
            </option>

            <option value="female">
              Female
            </option>
          </select>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="button"
            className="primary-btn"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Sign Up"}
          </button>
        </form>

        <p className="switch-text">
          Already have an account?

          <button
            type="button"
            onClick={() => setPage("login")}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;