import { useEffect, useRef, useState } from "react";

import ChatWindow from "./components/Chat/ChatWindow";
import LoginPage from "./components/Auth/LoginPage";
import SignupPage from "./components/Auth/SignupPage";
import ProfileModal from "./components/Profile/ProfileModal";
import Sidebar from "./components/Sidebar/Sidebar";

import useChatSocket from "./hooks/useChatSocket";
import useProfile from "./hooks/useProfile";
import useUsers from "./hooks/useUsers";
import useMessages from "./hooks/useMessages";
import useChatActions from "./hooks/useChatActions";

import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

/* =====================================================
   APP
===================================================== */

function App() {
  const [page, setPage] = useState(
    sessionStorage.getItem("token")
      ? "chat"
      : "login"
  );

  const [currentUser, setCurrentUser] =
    useState(() => {
      const savedUser =
        sessionStorage.getItem("user");

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
          apiUrl={API_URL}
        />
      )}

      {page === "signup" && (
        <SignupPage
          setPage={setPage}
          apiUrl={API_URL}
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
   CHAT PAGE
===================================================== */

function ChatPage({
  setPage,
  currentUser,
  setCurrentUser,
}) {
  const [selectedUser, setSelectedUser] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [error, setError] = useState("");

  const [notificationEnabled, setNotificationEnabled] =
    useState(
      typeof window !== "undefined" &&
        "Notification" in window
        ? Notification.permission === "granted"
        : false
    );

  const [showOnline, setShowOnline] =
    useState(() => {
      const userId =
        currentUser?.id ||
        currentUser?._id;

      if (!userId) {
        return true;
      }

      const saved =
        localStorage.getItem(
          `showOnline_${userId}`
        );

      return saved !== "false";
    });

  const [typingUserId, setTypingUserId] =
    useState(null);

  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserId = String(
    currentUser?.id ||
      currentUser?._id ||
      ""
  );

  const selectedUserId = String(
    selectedUser?.id ||
      selectedUser?._id ||
      ""
  );

  /* =====================================================
     USERS
  ===================================================== */

  const {
    users,
    setUsers,
    loadingUsers,
    unreadCounts,
    setUnreadCounts,
    search,
    setSearch,
    genderFilter,
    setGenderFilter,
    filteredUsers,
    onlineUsers,
    setOnlineUsers,
  } = useUsers({
    apiUrl: API_URL,
    setSelectedUser,
  });

  /* =====================================================
     MESSAGES
  ===================================================== */

  const {
    messages,
    setMessages,
    loadingMessages,
    sending,
    markConversationAsRead,
    sendMessage,
    deleteMessage,
  } = useMessages({
    apiUrl: API_URL,
    selectedUserId,
    socketRef,
    setUnreadCounts,
    setUsers,
  });

  /* =====================================================
     CHAT ACTIONS
  ===================================================== */

  const {
    selectUser,
    handleTyping,
    handleKeyDown,
    handleSendMessage,
    logout,
  } = useChatActions({
    selectedUserId,
    setSelectedUser,
    selectedUserRef,
    setMessage,
    setError,
    setTypingUserId,
    socketRef,
    sendMessage,
    setUnreadCounts,
    setCurrentUser,
    setPage,
  });

  /* =====================================================
     SOCKET
  ===================================================== */

  useChatSocket({
    socketUrl: SOCKET_URL,
    currentUserId,
    currentUser,
    users,
    selectedUserRef,
    markConversationAsRead,
    setMessages,
    setUnreadCounts,
    setUsers,
    setOnlineUsers,
    setTypingUserId,
    socketRef,
  });

  /* =====================================================
     PROFILE
  ===================================================== */

  const {
    showProfile,
    profileName,
    profileUsername,
    profilePhoto,
    profileSaving,
    profileError,
    setProfileName,
    setProfileUsername,
    openProfile,
    closeProfile,
    handleProfilePhoto,
    saveProfile,
  } = useProfile({
    currentUser,
    setCurrentUser,
    apiUrl: API_URL,
  });

  /* =====================================================
     BROWSER BACK
  ===================================================== */

  useEffect(() => {
    function handleBrowserBack() {
      const currentSelectedUser =
        selectedUserRef.current;

      if (currentSelectedUser) {
        setSelectedUser(null);
        selectedUserRef.current = null;

        window.history.pushState(
          { chatApp: true },
          "",
          window.location.href
        );
      }
    }

    if (!window.history.state?.chatApp) {
      window.history.pushState(
        { chatApp: true },
        "",
        window.location.href
      );
    }

    window.addEventListener(
      "popstate",
      handleBrowserBack
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handleBrowserBack
      );
    };
  }, []);

  /* =====================================================
     SELECTED USER REF
  ===================================================== */

  useEffect(() => {
    selectedUserRef.current =
      selectedUser;
  }, [selectedUser]);

  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages, selectedUserId]);

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setError(
        "This browser does not support notifications."
      );
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      setNotificationEnabled(
        permission === "granted"
      );
    } catch (error) {
      console.error(
        "Notification permission error:",
        error
      );
    }
  }

  useEffect(() => {
    if (!("Notification" in window)) {
      return;
    }

    setNotificationEnabled(
      Notification.permission === "granted"
    );
  }, []);

  /* =====================================================
     ONLINE VISIBILITY
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

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        "setPresence",
        {
          showOnline,
        }
      );
    }
  }, [showOnline, currentUser]);

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
     CURRENT MESSAGE
  ===================================================== */

  function sendCurrentMessage() {
    handleSendMessage(message).then(
      (sent) => {
        if (sent) {
          setTimeout(() => {
            messageInputRef.current?.focus();
          }, 0);
        }
      }
    );
  }

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
    <div
      className={`chat-app ${
        selectedUser
          ? "chat-open"
          : ""
      }`}
    >
      <Sidebar
        filteredUsers={filteredUsers}
        selectedUserId={selectedUserId}
        unreadCounts={unreadCounts}
        search={search}
        setSearch={setSearch}
        genderFilter={genderFilter}
        setGenderFilter={
          setGenderFilter
        }
        selectUser={selectUser}
        currentUser={currentUser}
        showOnline={showOnline}
        setShowOnline={
          setShowOnline
        }
        openProfile={openProfile}
        logout={logout}
        error={error}
      />

      <ChatWindow
        selectedUser={selectedUser}
        selectedUserIsOnline={
          selectedUserIsOnline
        }
        selectedUserIsTyping={
          selectedUserIsTyping
        }
        messages={messages}
        loadingMessages={
          loadingMessages
        }
        message={message}
        setMessage={setMessage}
        showEmojiPicker={
          showEmojiPicker
        }
        setShowEmojiPicker={
          setShowEmojiPicker
        }
        notificationEnabled={
          notificationEnabled
        }
        enableNotifications={
          enableNotifications
        }
        messageInputRef={
          messageInputRef
        }
        handleTyping={handleTyping}
        handleKeyDown={handleKeyDown}
        sendMessage={
          sendCurrentMessage
        }
        sending={sending}
        deleteMessage={deleteMessage}
        messagesEndRef={
          messagesEndRef
        }
        setSelectedUser={
          setSelectedUser
        }
      />

      <ProfileModal
        showProfile={showProfile}
        closeProfile={closeProfile}
        profileName={profileName}
        setProfileName={
          setProfileName
        }
        profileUsername={
          profileUsername
        }
        setProfileUsername={
          setProfileUsername
        }
        profilePhoto={profilePhoto}
        handleProfilePhoto={
          handleProfilePhoto
        }
        profileSaving={
          profileSaving
        }
        profileError={
          profileError
        }
        saveProfile={saveProfile}
      />
    </div>
  );
}

export default App;
