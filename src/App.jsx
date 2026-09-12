import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
  
// const API_URL = "http://localhost:5000/api";
// const SOCKET_URL = "http://localhost:5000";

/* =====================================================
   APP
===================================================== */

function App() {
  const [page, setPage] = useState(
    sessionStorage.getItem("token") ? "chat" : "login"
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  return (
    <div className="app">
      {page === "login" && (
        <LoginPage
          setPage={setPage}
          setCurrentUser={setCurrentUser}
        />
      )}

      {page === "signup" && (
        <SignupPage
          setPage={setPage}
          setCurrentUser={setCurrentUser}
        />
      )}

      {page === "chat" && (
        <ChatPage
          setPage={setPage}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}
    </div>
  );
}

/* =====================================================
   LOGIN PAGE
===================================================== */

function LoginPage({ setPage, setCurrentUser }) {
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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      setCurrentUser(data.user);
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

        <form>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="forgot">
            Forgot password?
          </div>

          {error && (
            <p className="jsx-style-1"
              
            >
              {error}
            </p>
          )}

          <button
            type="button"
            className="primary-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="switch-text">
          Don't have an account?

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

/* =====================================================
   SIGNUP PAGE
===================================================== */

function SignupPage({ setPage, setCurrentUser }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resendTimer, setResendTimer] = useState(0);

  /* =====================================================
     OTP RESEND TIMER
  ===================================================== */

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  /* =====================================================
     EMAIL CHANGE
  ===================================================== */

  function handleEmailChange(event) {
    const value = event.target.value;

    setEmail(value);

    // Email change invalidates previous OTP verification
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setResendTimer(0);
    setError("");
    setSuccess("");
  }

  /* =====================================================
     SEND OTP
  ===================================================== */

  async function handleSendOTP() {
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your college email.");
      return;
    }

    if (!cleanEmail.endsWith("@iiitvadodara.ac.in")) {
      setError(
        "Only IIIT Vadodara college email is allowed."
      );
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Could not send OTP."
        );
        return;
      }

      setEmail(cleanEmail);
      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");
      setResendTimer(60);

      setSuccess(
        "OTP sent successfully. Check your college email."
      );
    } catch (error) {
      console.error("Send OTP error:", error);
      setError("Cannot connect to server.");
    } finally {
      setOtpLoading(false);
    }
  }

  /* =====================================================
     VERIFY OTP
  ===================================================== */

  async function handleVerifyOTP() {
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your college email.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setVerifyLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Invalid OTP."
        );
        return;
      }

      setOtpVerified(true);

      setSuccess(
        "Email verified successfully. You can create your account now."
      );
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError("Cannot connect to server.");
    } finally {
      setVerifyLoading(false);
    }
  }

  /* =====================================================
     SIGNUP
  ===================================================== */
async function handleSignup() {
  setError("");
  setSuccess("");

  if (
    !username.trim() ||
    !email.trim() ||
    !password ||
    !gender
  ) {
    setError("Please fill all fields.");
    return;
  }

  if (!otpVerified) {
    setError(
      "Please verify your college email with OTP first."
    );
    return;
  }

  const cleanUsername =
    username.trim().toLowerCase().replace(/^@/, "");

  const cleanEmail =
    email.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
    setError(
      "Username can contain only letters, numbers, underscore and dot."
    );
    return;
  }

  if (
    cleanUsername.length < 3 ||
    cleanUsername.length > 30
  ) {
    setError(
      "Username must be between 3 and 30 characters."
    );
    return;
  }

  if (!cleanEmail.endsWith("@iiitvadodara.ac.in")) {
    setError(
      "Only IIIT Vadodara college email is allowed."
    );
    return;
  }

  if (password.length < 4) {
    setError(
      "Password must be at least 4 characters."
    );
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          password,
          gender,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.message || "Could not create account."
      );
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

    setCurrentUser(data.user);
    setPage("chat");
  } catch (error) {
    console.error("Signup error:", error);
    setError("Cannot connect to server.");
  } finally {
    setLoading(false);
  }
}

  /* =====================================================
     ENTER KEY
  ===================================================== */

  function handleKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (otpSent && !otpVerified) {
      handleVerifyOTP();
      return;
    }

    if (!otpVerified) {
      handleSendOTP();
      return;
    }

    handleSignup();
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>
            Join Messaging App with your college email
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        {/* USERNAME */}

        <div className="form-group">
          <label>Username</label>

          <input
            type="text"
            placeholder="@username"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            onKeyDown={handleKeyDown}
            maxLength={30}
          />

          <small>
            3–30 characters: letters, numbers, _
            and .
          </small>
        </div>

        {/* COLLEGE EMAIL */}

        <div className="form-group">
          <label>College Email</label>

          <div className="otp-email-row">
            <input
              type="email"
              placeholder="yourid@iiitvadodara.ac.in"
              value={email}
              onChange={handleEmailChange}
              onKeyDown={handleKeyDown}
              disabled={otpVerified}
            />

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={
                otpLoading ||
                resendTimer > 0 ||
                otpVerified
              }
              className="otp-button"
            >
              {otpLoading
                ? "Sending..."
                : otpVerified
                ? "Verified ✓"
                : resendTimer > 0
                ? `Resend (${resendTimer})`
                : otpSent
                ? "Resend OTP"
                : "Send OTP"}
            </button>
          </div>
        </div>

        {/* OTP */}

        {otpSent && !otpVerified && (
          <div className="form-group">
            <label>Enter OTP</label>

            <div className="otp-email-row">
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                onKeyDown={handleKeyDown}
                maxLength={6}
                inputMode="numeric"
              />

              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={
                  verifyLoading ||
                  otp.length !== 6
                }
                className="otp-button"
              >
                {verifyLoading
                  ? "Verifying..."
                  : "Verify OTP"}
              </button>
            </div>
          </div>
        )}

        {/* PASSWORD */}

        <div className="form-group">
          <label>Password</label>

          <div className="password-input-wrapper">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(
                  (previous) => !previous
                )
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* GENDER */}

      <div className="form-group">
      <label>Gender</label>

             <select
            value={gender}
              onChange={(event) => setGender(event.target.value)}
                >
               <option value="">Select Gender</option>
                <option value="male">Male</option>
                  <option value="female">Female</option>
                  </select>
              </div>

        {/* CREATE ACCOUNT */}

        <button
          type="button"
          className="auth-button"
          onClick={handleSignup}
          disabled={loading || !otpVerified}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

        <div className="auth-switch">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setPage("login")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
  

/* =====================================================
   CHAT PAGE
===================================================== */

function ChatPage({
  setPage,
  currentUser,
  setCurrentUser,
}) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [messages, setMessages] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [onlineUsers, setOnlineUsers] = useState([]);

  const [typingUserId, setTypingUserId] = useState(null);

  const [unreadCounts, setUnreadCounts] = useState({});
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission === "granted"
      : false
  );

  const socketRef = useRef(null);

  const selectedUserRef = useRef(null);

  const typingTimeoutRef = useRef(null);


  const [genderFilter, setGenderFilter] = useState("all");

  /*
    NEW:
    This ref points to the bottom of the message list.
  */
  const messagesEndRef = useRef(null);

  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(
    currentUser?.name || ""
  );
  const [profileUsername, setProfileUsername] = useState(
    currentUser?.username || ""
  );
  const [profilePhoto, setProfilePhoto] = useState(
    currentUser?.photo || ""
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const currentUserId = String(
    currentUser?.id || currentUser?._id || ""
  );

  const selectedUserId = String(
    selectedUser?.id ||
      selectedUser?._id ||
      ""
  );

  /* =====================================================
     BROWSER NOTIFICATIONS
  ===================================================== */

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setError("This browser does not support notifications.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationEnabled(permission === "granted");
    } catch (error) {
      console.error("Notification permission error:", error);
    }
  }

  useEffect(() => {
    if (!("Notification" in window)) {
      return;
    }

    setNotificationEnabled(Notification.permission === "granted");
  }, []);

  /* =====================================================
     KEEP CURRENT SELECTED USER IN REF
  ===================================================== */

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  /* =====================================================
     AUTO SCROLL TO NEWEST MESSAGE
  ===================================================== */

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    /*
      Small delay gives React time to render
      the new message before scrolling.
    */

    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages, selectedUserId]);

  /* =====================================================
     ONLINE VISIBILITY
  ===================================================== */

  const [showOnline, setShowOnline] = useState(() => {
    const userId =
      currentUser?.id || currentUser?._id;

    if (!userId) {
      return true;
    }

    const saved = localStorage.getItem(
      `showOnline_${userId}`
    );

    return saved !== "false";
  });

  /* =====================================================
     SOCKET CONNECTION
  ===================================================== */

  useEffect(() => {
    const token =
      sessionStorage.getItem("token");

    if (!token || !currentUserId) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit("join", {
        showOnline,
      });
    });

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );
      }
    );

    /* ================================
       PRESENCE SNAPSHOT
    ================================= */

    socket.on(
      "presenceSnapshot",
      ({ onlineUsers: usersOnline = [] }) => {
        setOnlineUsers(
          usersOnline.map((id) =>
            String(id)
          )
        );
      }
    );

    /* ================================
       PRESENCE UPDATE
    ================================= */

    socket.on(
      "presenceUpdate",
      ({ onlineUsers: usersOnline = [] }) => {
        setOnlineUsers(
          usersOnline.map((id) =>
            String(id)
          )
        );
      }
    );

    /* ================================
       NEW MESSAGE
    ================================= */

    socket.on(
      "newMessage",
      (newMessage) => {
        console.log(
          "New real-time message:",
          newMessage
        );

        const senderId = String(
          newMessage.sender
        );

        const messageId = String(
          newMessage.id ||
            newMessage._id
        );

        const formattedMessage = {
          id: messageId,
          text: newMessage.text,
          type: "received",
          time:
            newMessage.time ||
            new Date(
              newMessage.createdAt
            ).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
          createdAt:
            newMessage.createdAt,
          read: Boolean(
            newMessage.read
          ),
        };

        const currentlySelected =
          selectedUserRef.current;

        const currentlySelectedId =
          String(
            currentlySelected?.id ||
              currentlySelected?._id ||
              ""
          );

        /* ================================
           CURRENT CHAT OPEN
        ================================= */

        if (
          senderId ===
          currentlySelectedId
        ) {
          setMessages(
            (previousMessages) => {
              const alreadyExists =
                previousMessages.some(
                  (msg) =>
                    String(msg.id) ===
                    messageId
                );

              if (alreadyExists) {
                return previousMessages;
              }

              return [
                ...previousMessages,
                formattedMessage,
              ];
            }
          );

          markConversationAsRead(
            senderId
          );

          return;
        }

        /* ================================
           DIFFERENT CHAT
        ================================= */

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          typeof document !== "undefined" &&
          document.visibilityState !== "visible"
        ) {
          const sender = users.find(
            (user) =>
              String(user.id || user._id) === senderId
          );

          try {
            new Notification(
              sender?.name || "New message",
              {
                body: newMessage.text,
                icon: sender?.photo || undefined,
                tag: `message-${senderId}`,
              }
            );
          } catch (error) {
            console.error("Browser notification error:", error);
          }
        }

        setUnreadCounts(
          (previous) => ({
            ...previous,
            [senderId]:
              (previous[senderId] || 0) +
              1,
          })
        );

        setUsers(
          (previousUsers) =>
            previousUsers.map(
              (user) => {
                const userId =
                  String(
                    user.id ||
                      user._id
                  );

                if (
                  userId !==
                  senderId
                ) {
                  return user;
                }

                return {
                  ...user,
                  lastMessage:
                    newMessage.text,
                  time:
                    newMessage.time ||
                    new Date(
                      newMessage.createdAt
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    ),
                };
              }
            )
        );
      }
    );

    /* ================================
       MESSAGE DELETED
    ================================= */

    socket.on(
      "messageDeleted",
      ({ messageId }) => {
        const deletedId = String(messageId);

        setMessages((previousMessages) =>
          previousMessages.filter(
            (msg) => String(msg.id) !== deletedId
          )
        );
      }
    );

    /* ================================
       TYPING
    ================================= */

    socket.on(
      "userTyping",
      ({
        userId,
        isTyping,
      }) => {
        const typingId =
          String(userId);

        const currentlySelected =
          selectedUserRef.current;

        const currentlySelectedId =
          String(
            currentlySelected?.id ||
              currentlySelected?._id ||
              ""
          );

        if (
          typingId !==
          currentlySelectedId
        ) {
          return;
        }

        if (isTyping) {
          setTypingUserId(
            typingId
          );
        } else {
          setTypingUserId(null);
        }
      }
    );

    /* ================================
       MESSAGES READ
    ================================= */

    socket.on(
      "messagesRead",
      ({ userId }) => {
        const readerId =
          String(userId);

        const currentlySelected =
          selectedUserRef.current;

        const currentlySelectedId =
          String(
            currentlySelected?.id ||
              currentlySelected?._id ||
              ""
          );

        if (
          readerId !==
          currentlySelectedId
        ) {
          return;
        }

        setMessages(
          (previousMessages) =>
            previousMessages.map(
              (msg) => {
                if (
                  msg.type !==
                  "sent"
                ) {
                  return msg;
                }

                return {
                  ...msg,
                  read: true,
                };
              }
            )
        );
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Socket disconnected"
        );
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  /* =====================================================
     CHANGE ONLINE VISIBILITY
  ===================================================== */

  useEffect(() => {
    const userId =
      currentUser?.id ||
      currentUser?._id;

    if (!userId) {
      return;
    }

    localStorage.setItem(
      `showOnline_${userId}`,
      String(showOnline)
    );

    if (
      socketRef.current?.connected
    ) {
      socketRef.current.emit(
        "setPresence",
        {
          showOnline,
        }
      );
    }
  }, [
    showOnline,
    currentUser,
  ]);

  /* =====================================================
     MARK CONVERSATION AS READ
  ===================================================== */

  async function markConversationAsRead(
    senderId
  ) {
    if (!senderId) {
      return;
    }

    const senderIdString =
      String(senderId);

    setUnreadCounts(
      (previous) => {
        const updated = {
          ...previous,
        };

        delete updated[
          senderIdString
        ];

        return updated;
      }
    );

    if (
      socketRef.current?.connected
    ) {
      socketRef.current.emit(
        "markRead",
        {
          senderId:
            senderIdString,
        }
      );
    }

    const token =
      sessionStorage.getItem(
        "token"
      );

    if (!token) {
      return;
    }

    try {
      await fetch(
        `${API_URL}/messages/${senderIdString}/read`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error(
        "Mark read REST error:",
        error
      );
    }
  }

  /* =====================================================
     LOAD USERS
  ===================================================== */

  useEffect(() => {
    async function loadUsers() {
      const token =
        sessionStorage.getItem(
          "token"
        );

      if (!token) {
        setPage("login");
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/auth/users`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          if (
            response.status ===
            401
          ) {
            logout();
            return;
          }

          throw new Error(
            data.message
          );
        }

        const loadedUsers =
          (data.users || []).map(
            (user) => {
              const userId =
                String(
                  user.id ||
                    user._id
                );

              return {
                ...user,
                id: userId,
                online:
                  onlineUsers.includes(
                    userId
                  ),
                initial:
                  user.initial ||
                  user.name
                    ?.charAt(0)
                    .toUpperCase(),
                lastMessage:
                  user.lastMessage ||
                  "",
                time:
                  user.time ||
                  "",
              };
            }
          );

        setUsers(
          loadedUsers
        );

        if (
          loadedUsers.length >
          0
        ) {
          setSelectedUser(
            loadedUsers[0]
          );
        }
      } catch (error) {
        console.error(error);

        setError(
          "Could not load users."
        );
      } finally {
        setLoadingUsers(
          false
        );
      }
    }

    loadUsers();
  }, []);

  /* =====================================================
     SYNC ONLINE STATUS
  ===================================================== */

  useEffect(() => {
    setUsers(
      (previousUsers) =>
        previousUsers.map(
          (user) => {
            const userId =
              String(
                user.id ||
                  user._id
              );

            return {
              ...user,
              online:
                onlineUsers.includes(
                  userId
                ),
            };
          }
        )
    );

    setSelectedUser(
      (previousSelected) => {
        if (
          !previousSelected
        ) {
          return previousSelected;
        }

        const userId =
          String(
            previousSelected.id ||
              previousSelected._id
          );

        return {
          ...previousSelected,
          online:
            onlineUsers.includes(
              userId
            ),
        };
      }
    );
  }, [onlineUsers]);

  /* =====================================================
     LOAD UNREAD COUNTS
  ===================================================== */

  useEffect(() => {
    async function loadUnreadCounts() {
      const token =
        sessionStorage.getItem(
          "token"
        );

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/messages/unread/counts`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          setUnreadCounts(
            data.counts || {}
          );
        }
      } catch (error) {
        console.error(
          "Unread count error:",
          error
        );
      }
    }

    loadUnreadCounts();
  }, []);

  /* =====================================================
     LOAD MESSAGES + LIVE MESSAGE SYNC
  ===================================================== */

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    let cancelled = false;
    let intervalId = null;
    let firstLoad = true;
    let lastServerSignature = null;

    async function loadMessages() {
      const token =
        sessionStorage.getItem(
          "token"
        );

      if (!token) {
        return;
      }

      try {
        if (firstLoad) {
          setLoadingMessages(true);
        }

        const response =
          await fetch(
            `${API_URL}/messages/${selectedUserId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not load messages."
          );
        }

        if (cancelled) {
          return;
        }

        const serverMessages =
          data.messages || [];

        const serverSignature =
          serverMessages
            .map((msg) =>
              [
                String(
                  msg.id || msg._id || ""
                ),
                msg.text || "",
                Boolean(msg.read),
                msg.readAt || "",
                msg.createdAt || "",
              ].join("|")
            )
            .join("||");

        const hasChanged =
          lastServerSignature !==
          serverSignature;

        if (hasChanged) {
          lastServerSignature =
            serverSignature;

          /*
            This update triggers the existing auto-scroll
            effect, so a newly received message is shown
            automatically at the bottom.
          */
          setMessages(serverMessages);

          await markConversationAsRead(
            selectedUserId
          );
        }
      } catch (error) {
        console.error(
          "Load messages error:",
          error
        );

        if (firstLoad && !cancelled) {
          setError(
            "Could not load messages."
          );
        }
      } finally {
        if (firstLoad && !cancelled) {
          setLoadingMessages(false);
        }
      }

      firstLoad = false;
    }

    /* Load immediately. */
    loadMessages();

    /*
      Check once every second so incoming messages
      appear without refreshing the page.
    */
    intervalId = setInterval(
      loadMessages,
      1000
    );

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedUserId]);


  /* =====================================================
     DELETE MESSAGE
  ===================================================== */

  async function deleteMessage(messageId) {
    if (!messageId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this message?"
    );

    if (!shouldDelete) {
      return;
    }

    const token = sessionStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/messages/message/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not delete message."
        );
      }

      setMessages((previousMessages) =>
        previousMessages.filter(
          (msg) => String(msg.id) !== String(messageId)
        )
      );
    } catch (error) {
      console.error("Delete message error:", error);
      setError(error.message || "Could not delete message.");
    }
  }

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  async function sendMessage() {
    if (!message.trim()) {
      return;
    }

    if (!selectedUserId) {
      return;
    }

    const token =
      sessionStorage.getItem(
        "token"
      );

    if (!token) {
      return;
    }

    setSending(true);

    if (
      socketRef.current
    ) {
      socketRef.current.emit(
        "typing",
        {
          receiverId:
            selectedUserId,
          isTyping: false,
        }
      );
    }

    try {
      const response =
        await fetch(
          `${API_URL}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              receiverId:
                selectedUserId,
              text:
                message.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message
        );
      }

      const newMessage = {
        id: String(
          data.message.id ||
            data.message._id
        ),
        text:
          data.message.text,
        type: "sent",
        time: new Date(
          data.message.createdAt
        ).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        createdAt:
          data.message.createdAt,
        read: Boolean(
          data.message.read
        ),
      };

      setMessages(
        (previousMessages) => {
          const exists =
            previousMessages.some(
              (msg) =>
                String(msg.id) ===
                String(
                  newMessage.id
                )
            );

          if (exists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            newMessage,
          ];
        }
      );

      setUsers(
        (previousUsers) =>
          previousUsers.map(
            (user) => {
              const userId =
                String(
                  user.id ||
                    user._id
                );

              if (
                userId !==
                selectedUserId
              ) {
                return user;
              }

              return {
                ...user,
                lastMessage:
                  newMessage.text,
                time:
                  newMessage.time,
              };
            }
          )
      );

      setMessage("");
    } catch (error) {
      console.error(error);

      setError(
        "Message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  /* =====================================================
     TYPING
  ===================================================== */

  function handleTyping(e) {
    const value =
      e.target.value;

    setMessage(value);

    if (
      !socketRef.current ||
      !selectedUserId
    ) {
      return;
    }

    socketRef.current.emit(
      "typing",
      {
        receiverId:
          selectedUserId,
        isTyping:
          value.trim()
            .length > 0,
      }
    );

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {
        socketRef.current?.emit(
          "typing",
          {
            receiverId:
              selectedUserId,
            isTyping: false,
          }
        );
      }, 1200);
  }

  /* =====================================================
     ENTER KEY
  ===================================================== */

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  /* =====================================================
     SELECT USER
  ===================================================== */

  function selectUser(user) {
    setSelectedUser(user);

    selectedUserRef.current =
      user;

    setMessage("");
    setError("");
    setTypingUserId(null);

    const userId = String(
      user.id || user._id
    );

    setUnreadCounts(
      (previous) => {
        const updated = {
          ...previous,
        };

        delete updated[userId];

        return updated;
      }
    );
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  function openProfile() {
    setProfileName(currentUser?.name || "");
    setProfileUsername(currentUser?.username || "");
    setProfilePhoto(currentUser?.photo || "");
    setProfileError("");
    setShowProfile(true);
  }

  function closeProfile() {
    if (profileSaving) return;

    setShowProfile(false);
    setProfileError("");
  }

  async function handleProfilePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setProfileError("Photo must be smaller than 8 MB.");
      return;
    }

    try {
      const compressedPhoto = await new Promise(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            const image = new Image();

            image.onload = () => {
              const maxSize = 500;

              let width = image.width;
              let height = image.height;

              if (width > height && width > maxSize) {
                height = Math.round(
                  (height * maxSize) / width
                );
                width = maxSize;
              } else if (height >= width && height > maxSize) {
                width = Math.round(
                  (width * maxSize) / height
                );
                height = maxSize;
              }

              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;

              const context = canvas.getContext("2d");

              if (!context) {
                reject(new Error("Could not process image."));
                return;
              }

              context.drawImage(
                image,
                0,
                0,
                width,
                height
              );

              resolve(
                canvas.toDataURL("image/jpeg", 0.8)
              );
            };

            image.onerror = () =>
              reject(new Error("Could not read image."));

            image.src = reader.result;
          };

          reader.onerror = () =>
            reject(new Error("Could not read file."));

          reader.readAsDataURL(file);
        }
      );

      setProfilePhoto(compressedPhoto);
      setProfileError("");
    } catch (error) {
      console.error(error);
      setProfileError("Could not load this photo.");
    }

    event.target.value = "";
  }

  async function saveProfile() {
    const token = sessionStorage.getItem("token");

    if (!token) return;

    const cleanName = profileName.trim();
    const cleanUsername =
      profileUsername.trim().toLowerCase();

    if (!cleanName) {
      setProfileError("Name cannot be empty.");
      return;
    }

    if (!cleanUsername) {
      setProfileError("Username cannot be empty.");
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      setProfileError(
        "Username can contain only letters, numbers, underscore and dot."
      );
      return;
    }

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30
    ) {
      setProfileError(
        "Username must be between 3 and 30 characters."
      );
      return;
    }

    setProfileSaving(true);
    setProfileError("");

    try {
      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: cleanName,
            username: cleanUsername,
            photo: profilePhoto || "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not update profile."
        );
      }

      const updatedUser = data.user;

      setCurrentUser(updatedUser);

      sessionStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setProfileName(updatedUser.name || "");
      setProfileUsername(updatedUser.username || "");
      setProfilePhoto(updatedUser.photo || "");
      setShowProfile(false);
    } catch (error) {
      console.error(error);
      setProfileError(
        error.message || "Could not update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  function logout() {
    if (
      socketRef.current
    ) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    sessionStorage.removeItem(
      "token"
    );

    sessionStorage.removeItem(
      "user"
    );

    setCurrentUser(null);
    setPage("login");
  }

  /* =====================================================
     STATUS
  ===================================================== */

  const selectedUserIsOnline =
    selectedUserId &&
    onlineUsers.includes(
      selectedUserId
    );

  const selectedUserIsTyping =
    typingUserId ===
    selectedUserId;

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredUsers =
  users.filter((user) => {
    const query = search.toLowerCase();

    const matchesSearch =
      user.name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query);

    const matchesGender =
      genderFilter === "all" ||
      user.gender === genderFilter;

    return matchesSearch && matchesGender;
  });
  /* =====================================================
     LOADING
  ===================================================== */

  if (loadingUsers) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>
            Loading users...
          </h2>

          <p className="auth-subtitle">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     CHAT UI
  ===================================================== */

  return (
    <div className={`chat-app ${selectedUser ? "chat-open" : ""}`}>

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="sidebar-top">
          <h2>
            mairochat
          </h2>

          <button className="new-chat-btn">
            + New
          </button>
        </div>

        {/* SEARCH */}

        <div className="search-box">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {/* ERROR */}

        {error && (
          <p className="jsx-style-2"
            
          >
            {error}
          </p>
        )}


        <div className="gender-filter">
  <button
    type="button"
    className={genderFilter === "all" ? "active" : ""}
    onClick={() => setGenderFilter("all")}
  >
    All
  </button>

  <button
    type="button"
    className={genderFilter === "male" ? "active" : ""}
    onClick={() => setGenderFilter("male")}
  >
    Male
  </button>

  <button
    type="button"
    className={genderFilter === "female" ? "active" : ""}
    onClick={() => setGenderFilter("female")}
  >
    Female
  </button>
</div>

        {/* USERS */}

<div className="chat-list">
  {filteredUsers.length > 0 ? (
    filteredUsers.map((user) => {
      const userId = String(user.id || user._id);
      const unread = unreadCounts[userId] || 0;

      return (
        <div
          key={userId}
          className={`chat-user ${
            selectedUserId === userId ? "active" : ""
          }`}
          onClick={() => selectUser(user)}
        >
          {/* Avatar */}
          <div className="avatar">
            {user.photo ? (
              <img
                src={user.photo}
                alt={`@${user.username}`}
                className="chat-user-photo"
              />
            ) : (
              user.initial ||
              user.username?.charAt(0).toUpperCase()
            )}

            {user.online && (
              <span className="online-dot"></span>
            )}
          </div>

          {/* User Info */}
          <div className="chat-info">
            {/* Username + Time */}
            <div className="chat-name">
              <strong>@{user.username}</strong>

              <span>{user.time}</span>
            </div>

            {/* Last Message + Unread Count */}
           {/* Online / Offline Status */}
            <div className="chat-status-row">
              <span
               className={`status-dot ${
               user.online ? "status-online" : "status-offline"
                              }`}
                     ></span>

                 <span
               className={`status-text ${
                  user.online ? "text-online" : "text-offline"
                  }`}
                      >
                    {user.online ? "Online" : "Offline"}
                  </span>

                {unread > 0 && (
                <span className="unread-badge">
                {unread > 99 ? "99+" : unread}
               </span>
                   )}
                </div>
          </div>
        </div>
      );
    })
  ) : (
    <div className="no-results">
      {search
        ? "No users found"
        : "No other users yet"}
    </div>
  )}
</div>
        {/* =================================================
            PROFILE
        ================================================= */}

        <div
          className="profile jsx-style-3"
          onClick={openProfile}
          
        >

          <div className="avatar small">

            {currentUser?.photo ? (
              <img className="jsx-style-4"
                src={currentUser.photo}
                alt={currentUser.name}
                
              />
            ) : (
              currentUser?.name
                ? currentUser.name
                    .charAt(0)
                    .toUpperCase()
                : "U"
            )}

            {showOnline && (
              <span className="online-dot"></span>
            )}

          </div>

          <div className="jsx-style-5"
            
          >

            <strong>
              {currentUser?.name ||
                "My Profile"}
            </strong>

            <p className="jsx-style-6"
              
              onClick={() =>
                setShowOnline(
                  (previous) =>
                    !previous
                )
              }
            >
              {showOnline
                ? "🟢 Online"
                : "⚫ Invisible"}
            </p>

          </div>

          <button className="jsx-style-7"
            type="button"
            onClick={() =>
              setShowOnline(
                (previous) =>
                  !previous
              )
            }
            
            title={
              showOnline
                ? "Hide my online status"
                : "Show my online status"
            }
          >
            {showOnline
              ? "🟢"
              : "⚫"}
          </button>

          <button
            className="logout-btn"
            onClick={(event) => {
              event.stopPropagation();
              logout();
            }}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          CHAT AREA
      ================================================= */}

      <main className="chat-area">

        {selectedUser ? (
          <>

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="chat-header">

              <button
                type="button"
                className="mobile-back-btn"
                onClick={() => setSelectedUser(null)}
                aria-label="Back to chats"
                >
                 ←
                </button>

              <div className="avatar">

                {selectedUser.initial ||
                selectedUser.username?.charAt(0).toUpperCase()}

                {selectedUserIsOnline && (
                  <span className="online-dot"></span>
                )}

              </div>

              <div>

                <strong>
                    @{selectedUser.username}
                </strong>

                <p>
                  {selectedUserIsTyping
                    ? "typing..."
                    : selectedUserIsOnline
                    ? "Online"
                    : "Offline"}
                </p>

              </div>

              <div className="header-actions">

                <button>
                  🔍
                </button>

                <button>
                  ⋮
                </button>

              </div>

            </header>

            {/* =================================================
                MESSAGES
            ================================================= */}

            <section className="messages">

              <div className="today">
                Today
              </div>

              {loadingMessages ? (

                <div className="no-messages">
                  Loading messages...
                </div>

              ) : messages.length ===
                0 ? (

                <div className="no-messages">
                   Start a conversation with{" "}
                     @{selectedUser.username}
                </div>

              ) : (

                messages.map(
                  (msg) => (

                    <div key={msg.id}
                      className={`message ${msg.type} jsx-style-8`}
                      
                    >

                      <p>
                        {msg.text}
                      </p>

                      <span>

                        {msg.time}

                        {msg.type ===
                          "sent" && (
                          <span>
                            {" "}
                            {msg.read
                              ? "✓✓"
                              : "✓"}
                          </span>
                        )}

                      </span>

                      {msg.type === "sent" && (
                        <button className="jsx-style-9"
                          type="button"
                          onClick={() => deleteMessage(msg.id)}
                          title="Delete message"
                          
                        >
                          🗑️
                        </button>
                      )}

                    </div>

                  )
                )

              )}

              {/* =================================================
                  AUTO SCROLL TARGET
              ================================================= */}

              <div className="jsx-style-10"
                ref={messagesEndRef}
                
              />

            </section>

            {/* =================================================
                INPUT
            ================================================= */}

            <div
              className="message-input jsx-style-11"
              
            >

              {showEmojiPicker && (
                <div className="jsx-style-12"
                  
                >
                  <EmojiPicker
                    theme="dark"
                    width={320}
                    height={400}
                    onEmojiClick={(emojiObject) => {
                      setMessage((previous) =>
                        previous + emojiObject.emoji
                      );
                    }}
                  />
                </div>
              )}

              <button
                type="button"
                className="input-action"
                onClick={() =>
                  setShowEmojiPicker((previous) => !previous)
                }
              >
                😊
              </button>

              <button
                type="button"
                className="input-action"
                onClick={enableNotifications}
                title={
                  notificationEnabled
                    ? "Notifications enabled"
                    : "Enable notifications"
                }
              >
                {notificationEnabled ? "🔔" : "🔕"}
              </button>

              <button
                type="button"
                className="input-action"
              >
                📎
              </button>

              <input
                type="text"
                 placeholder={`Message @${selectedUser.username}...`}
                value={message}
                onChange={
                  handleTyping
                }
                onKeyDown={
                  handleKeyDown
                }
                disabled={
                  sending
                }
              />

              <button
                type="button"
                className="send-btn"
                onClick={
                  sendMessage
                }
                disabled={
                  sending
                }
              >
                {sending
                  ? "..."
                  : "➤"}
              </button>

            </div>

          </>
        ) : (

          <div className="no-chat-selected">

            <div>
              💬
            </div>

            <h2>
              No conversation selected
            </h2>

            <p>
              Create another account
              to start chatting.
            </p>

          </div>

        )}

      </main>

      {/* =================================================
          PROFILE MODAL
      ================================================= */}

      {showProfile && (
        <div className="jsx-style-13"
          onClick={closeProfile}
          
        >
          <div className="jsx-style-14"
            onClick={(event) =>
              event.stopPropagation()
            }
            
          >
            <div className="jsx-style-15"
              
            >
              <h2 className="jsx-style-16"
                
              >
                My Profile
              </h2>

              <button className="jsx-style-17"
                type="button"
                onClick={closeProfile}
                disabled={profileSaving}
                
              >
                ×
              </button>
            </div>

            {/* PROFILE PHOTO */}

            <div className="jsx-style-18"
              
            >
              <label className="jsx-style-19"
                
                title="Change profile photo"
              >
                {profilePhoto ? (
                  <img className="jsx-style-20"
                    src={profilePhoto}
                    alt="Profile"
                    
                  />
                ) : (
                  <span className="jsx-style-21"
                    
                  >
                    {profileName
                      ? profileName
                          .charAt(0)
                          .toUpperCase()
                      : "U"}
                  </span>
                )}

                <input className="jsx-style-22"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhoto}
                  
                />
              </label>

              <p className="jsx-style-23"
                
              >
                Click photo to change
              </p>
            </div>

            {/* NAME */}

            <label className="jsx-style-24"
              
            >
              Full Name
            </label>

            <input className="jsx-style-25"
              type="text"
              value={profileName}
              onChange={(event) =>
                setProfileName(event.target.value)
              }
              disabled={profileSaving}
              maxLength={50}
              
            />

            {/* USERNAME */}

            <label className="jsx-style-26"
              
            >
              Username
            </label>

            <input className="jsx-style-27"
              type="text"
              value={profileUsername}
              onChange={(event) =>
                setProfileUsername(
                  event.target.value
                )
              }
              disabled={profileSaving}
              maxLength={30}
              
            />

            <p className="jsx-style-28"
              
            >
              Only letters, numbers, underscore and dot.
            </p>

            {profileError && (
              <p className="jsx-style-29"
                
              >
                {profileError}
              </p>
            )}

            <div className="jsx-style-30"
              
            >
              <button className="jsx-style-31"
                type="button"
                onClick={closeProfile}
                disabled={profileSaving}
                
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProfile}
                disabled={profileSaving}
                className="primary-btn jsx-style-32"
                
              >
                {profileSaving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;