import { useCallback, useRef } from "react";

function useChatActions({
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
}) {
  const sendingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  /* =====================================================
     SELECT USER
  ===================================================== */

  function selectUser(user) {
    if (!user) {
      return;
    }

    const userId = String(
      user.id || user._id || ""
    );

    if (!userId) {
      console.error(
        "Cannot select user: user ID missing.",
        user
      );
      return;
    }

    console.log(
      "SELECTING USER:",
      user.username,
      userId
    );

    // Stop previous typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (socketRef.current && selectedUserId) {
      socketRef.current.emit("typing", {
        receiverId: selectedUserId,
        isTyping: false,
      });
    }

    // Select new user
    setSelectedUser(user);

    // Keep ref updated immediately
    if (selectedUserRef) {
      selectedUserRef.current = user;
    }

    // Clear current input/error
    setMessage("");
    setError("");
    setTypingUserId(null);

    // Clear unread count for this user
    if (setUnreadCounts) {
      setUnreadCounts((previous) => ({
        ...previous,
        [userId]: 0,
      }));
    }

    // Add browser history state for mobile back button
    if (
      typeof window !== "undefined" &&
      window.history
    ) {
      window.history.pushState(
        { chatApp: true, userId },
        "",
        window.location.href
      );
    }
  }

  /* =====================================================
     TYPING
  ===================================================== */

  function handleTyping(event) {
    const value = event.target.value;

    setMessage(value);

    if (
      !selectedUserId ||
      !socketRef.current
    ) {
      return;
    }

    socketRef.current.emit("typing", {
      receiverId: selectedUserId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit(
            "typing",
            {
              receiverId:
                selectedUserId,
              isTyping: false,
            }
          );
        }

        setTypingUserId(null);
      }, 800);
  }

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  async function handleSendMessage(text) {
    const cleanMessage =
      String(text || "").trim();

    if (!cleanMessage) {
      return false;
    }

    if (!selectedUserId) {
      setError("Please select a user first.");
      return false;
    }

    if (sendingRef.current) {
      return false;
    }

    sendingRef.current = true;

    try {
      /*
       * sendMessage comes from useMessages.
       * It handles the API request and message state.
       */
      const result =
        await sendMessage(cleanMessage);

      if (result === false) {
        return false;
      }

      setMessage("");

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current
        );
        typingTimeoutRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.emit(
          "typing",
          {
            receiverId:
              selectedUserId,
            isTyping: false,
          }
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      setError(
        error.message ||
          "Could not send message."
      );

      return false;
    } finally {
      sendingRef.current = false;
    }
  }

  /* =====================================================
     KEY DOWN
  ===================================================== */

  function handleKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    /*
     * Shift + Enter can still create a new line.
     */
    if (event.shiftKey) {
      return;
    }

    event.preventDefault();

    const text =
      event.currentTarget?.value || "";

    handleSendMessage(text);
  }

  /* =====================================================
     ENABLE NOTIFICATIONS
  ===================================================== */

  async function enableNotifications() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      return permission === "granted";
    } catch (error) {
      console.error(
        "Notification permission error:",
        error
      );

      return false;
    }
  }

  /* =====================================================
     DELETE MESSAGE
     
     Message deletion is already handled by
     useMessages, so this hook does not duplicate it.
  ===================================================== */

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = useCallback(() => {
    console.log("LOGOUT CLICKED");

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current
      );
      typingTimeoutRef.current = null;
    }

    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear session storage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // Reset chat
    setSelectedUser(null);

    if (selectedUserRef) {
      selectedUserRef.current = null;
    }

    setTypingUserId(null);
    setMessage("");

    // Go to login
    setCurrentUser(null);
    setPage("login");
  }, [
    socketRef,
    selectedUserRef,
    setSelectedUser,
    setTypingUserId,
    setMessage,
    setCurrentUser,
    setPage,
  ]);

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    selectUser,
    handleTyping,
    handleKeyDown,
    handleSendMessage,
    enableNotifications,
    handleLogout,
  };
}

export default useChatActions;