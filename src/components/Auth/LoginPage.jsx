import { useState } from "react";

function LoginPage({ setPage, setCurrentUser, apiUrl }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      // =====================================================
      // SAVE LOGIN IN BOTH STORAGE
      // =====================================================

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // =====================================================
      // UPDATE APP STATE
      // =====================================================

      setCurrentUser(data.user);
      setPage("chat");
    } catch (error) {
      console.error("Login error:", error);
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLogin();
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">💬</div>

        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Login to continue chatting
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleLogin();
          }}
        >
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            onKeyDown={handleKeyDown}
            autoComplete="email"
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />

          <div className="forgot">
            Forgot password?
          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="switch-text">
          Don't have an account?{" "}

          <button
            type="button"
            onClick={() => setPage("signup")}
          >
            Sign up
          </button>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;