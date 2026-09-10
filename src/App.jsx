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
            <p
              style={{
                color: "#ef4444",
                fontSize: "13px",
              }}
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
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    setError("");

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill all fields.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      setError(
        "Username can contain only letters, numbers, underscore and dot."
      );
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username: cleanUsername,
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💬</div>

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Create your account to start chatting
        </p>

        <form>
          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Username</label>

          <input
            type="text"
            placeholder="Choose a unique username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            autoComplete="username"
          />

          <p
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              marginTop: "-6px",
              marginBottom: "14px",
            }}
          >
            Letters, numbers, underscore and dot only.
          </p>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />

          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "13px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            className="primary-btn"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
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

      return (
        user.name?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query)
      );
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
    <div className="chat-app">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="sidebar-top">
          <h2>
            ChatApp
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
          <p
            style={{
              color:
                "#ef4444",
              padding:
                "10px",
              fontSize:
                "13px",
            }}
          >
            {error}
          </p>
        )}

        {/* USERS */}

        <div className="chat-list">

          {filteredUsers.length >
          0 ? (
            filteredUsers.map(
              (user) => {

                const userId =
                  String(
                    user.id ||
                      user._id
                  );

                const unread =
                  unreadCounts[
                    userId
                  ] || 0;

                return (
                  <div
                    key={userId}
                    className={`chat-user ${
                      selectedUserId ===
                      userId
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      selectUser(
                        user
                      )
                    }
                  >

                    <div className="avatar">

                      {user.photo ? (
                        <img
                          src={user.photo}
                          alt={user.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        user.initial ||
                        user.name
                          .charAt(0)
                          .toUpperCase()
                      )}

                      {user.online && (
                        <span className="online-dot"></span>
                      )}

                    </div>

                    <div className="chat-info">

                      <div className="chat-name">

                        <strong>
                          {user.name}
                        </strong>

                        <span>
                          {user.time}
                        </span>

                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap:
                            "8px",
                        }}
                      >

                        <p
                          style={{
                            margin:
                              0,
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {user.username
                            ? `@${user.username}`
                            : user.lastMessage ||
                              "Start a conversation"}
                        </p>

                        {unread >
                          0 && (
                          <span
                            style={{
                              minWidth:
                                "20px",
                              height:
                                "20px",
                              borderRadius:
                                "50%",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                "#6366f1",
                              color:
                                "white",
                              fontSize:
                                "11px",
                              fontWeight:
                                "bold",
                              padding:
                                "0 5px",
                              flexShrink:
                                0,
                            }}
                          >
                            {unread >
                            99
                              ? "99+"
                              : unread}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )
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
          className="profile"
          onClick={openProfile}
          style={{
            cursor: "pointer",
          }}
        >

          <div className="avatar small">

            {currentUser?.photo ? (
              <img
                src={currentUser.photo}
                alt={currentUser.name}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
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

          <div
            style={{
              flex: 1,
              minWidth:
                0,
            }}
          >

            <strong>
              {currentUser?.name ||
                "My Profile"}
            </strong>

            <p
              style={{
                cursor:
                  "pointer",
                userSelect:
                  "none",
              }}
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

          <button
            type="button"
            onClick={() =>
              setShowOnline(
                (previous) =>
                  !previous
              )
            }
            style={{
              background:
                "transparent",
              border:
                "none",
              cursor:
                "pointer",
              fontSize:
                "18px",
              padding:
                "4px",
            }}
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

              <div className="avatar">

                {selectedUser.initial ||
                  selectedUser.name
                    .charAt(0)
                    .toUpperCase()}

                {selectedUserIsOnline && (
                  <span className="online-dot"></span>
                )}

              </div>

              <div>

                <strong>
                  {selectedUser.name}
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
                  Start a conversation
                  with{" "}
                  {selectedUser.name}
                </div>

              ) : (

                messages.map(
                  (msg) => (

                    <div
                      key={msg.id}
                      className={`message ${msg.type}`}
                      style={{
                        position: "relative",
                      }}
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
                        <button
                          type="button"
                          onClick={() => deleteMessage(msg.id)}
                          title="Delete message"
                          style={{
                            marginLeft: "8px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: "12px",
                            opacity: 0.65,
                          }}
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

              <div
                ref={messagesEndRef}
                style={{
                  height: "1px",
                }}
              />

            </section>

            {/* =================================================
                INPUT
            ================================================= */}

            <div
              className="message-input"
              style={{ position: "relative" }}
            >

              {showEmojiPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "65px",
                    left: "0",
                    zIndex: 9999,
                  }}
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
                placeholder={`Message ${selectedUser.name}...`}
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
        <div
          onClick={closeProfile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "430px",
              background: "#171923",
              border: "1px solid #2b2f3d",
              borderRadius: "18px",
              padding: "28px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#fff",
                }}
              >
                My Profile
              </h2>

              <button
                type="button"
                onClick={closeProfile}
                disabled={profileSaving}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#cbd5e1",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* PROFILE PHOTO */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <label
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "3px solid #818cf8",
                }}
                title="Change profile photo"
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: "#fff",
                      fontSize: "40px",
                      fontWeight: "700",
                    }}
                  >
                    {profileName
                      ? profileName
                          .charAt(0)
                          .toUpperCase()
                      : "U"}
                  </span>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhoto}
                  style={{
                    display: "none",
                  }}
                />
              </label>

              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  marginTop: "10px",
                  marginBottom: 0,
                }}
              >
                Click photo to change
              </p>
            </div>

            {/* NAME */}

            <label
              style={{
                display: "block",
                color: "#e2e8f0",
                fontSize: "14px",
                marginBottom: "7px",
              }}
            >
              Full Name
            </label>

            <input
              type="text"
              value={profileName}
              onChange={(event) =>
                setProfileName(event.target.value)
              }
              disabled={profileSaving}
              maxLength={50}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginBottom: "18px",
              }}
            />

            {/* USERNAME */}

            <label
              style={{
                display: "block",
                color: "#e2e8f0",
                fontSize: "14px",
                marginBottom: "7px",
              }}
            >
              Username
            </label>

            <input
              type="text"
              value={profileUsername}
              onChange={(event) =>
                setProfileUsername(
                  event.target.value
                )
              }
              disabled={profileSaving}
              maxLength={30}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginBottom: "7px",
              }}
            />

            <p
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginTop: 0,
                marginBottom: "18px",
              }}
            >
              Only letters, numbers, underscore and dot.
            </p>

            {profileError && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              >
                {profileError}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={closeProfile}
                disabled={profileSaving}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #303545",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProfile}
                disabled={profileSaving}
                className="primary-btn"
                style={{
                  flex: 1,
                }}
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