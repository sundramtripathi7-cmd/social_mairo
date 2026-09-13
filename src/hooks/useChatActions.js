import { useEffect, useRef } from "react";

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
  const typingTimeoutRef =
    useRef(null);

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

    setUnreadCounts((previous) => {
      const updated = {
        ...previous,
      };

      delete updated[userId];

      return updated;
    });
  }

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
          value.trim().length > 0,
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

  async function handleKeyDown(e) {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const text =
      e.currentTarget.value;

    if (!text.trim()) {
      return;
    }

    try {
      const sent =
        await sendMessage(text);

      if (sent) {
        setMessage("");
      }
    } catch {
      setError(
        "Message could not be sent."
      );
    }
  }

  async function handleSendMessage(
    messageText
  ) {
    try {
      const sent =
        await sendMessage(
          messageText
        );

      if (sent) {
        setMessage("");
      }

      return sent;
    } catch {
      setError(
        "Message could not be sent."
      );

      return false;
    }
  }

  function logout() {
    if (socketRef.current) {
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

  useEffect(() => {
    return () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }
    };
  }, []);

  return {
    selectUser,
    handleTyping,
    handleKeyDown,
    handleSendMessage,
    logout,
  };
}

export default useChatActions;