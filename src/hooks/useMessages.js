import {
  useEffect,
  useState,
} from "react";

function useMessages({
  apiUrl,
  selectedUserId,
  socketRef,
  setUnreadCounts,
  setUsers,
}) {
  const [messages, setMessages] =
    useState([]);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  /* =====================================================
     TOKEN
  ===================================================== */

  function getToken() {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  }

  /* =====================================================
     FORMAT MESSAGE
  ===================================================== */

  function formatMessage(msg) {
    const messageId =
      msg?.id ||
      msg?._id;

    const senderId =
      msg?.sender?.id ||
      msg?.sender?._id ||
      msg?.sender;

    const receiverId =
      msg?.receiver?.id ||
      msg?.receiver?._id ||
      msg?.receiver;

    return {
      ...msg,

      id: messageId,

      text: msg?.text || "",

      sender:
        senderId
          ? String(senderId)
          : "",

      receiver:
        receiverId
          ? String(receiverId)
          : "",

      type:
        msg?.type ||
        "received",

      time:
        msg?.time ||
        (
          msg?.createdAt
            ? new Date(
                msg.createdAt
              ).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
            : ""
        ),

      createdAt:
        msg?.createdAt,

      read:
        Boolean(msg?.read),

      readAt:
        msg?.readAt || null,
    };
  }

  /* =====================================================
     LOAD MESSAGES
  ===================================================== */

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    let intervalId = null;

    let firstLoad = true;
    let lastServerSignature = null;

    async function loadMessages() {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        if (firstLoad) {
          setLoadingMessages(true);
        }

        const response =
          await fetch(
            `${apiUrl}/messages/${selectedUserId}`,
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
          (data.messages || []).map(
            formatMessage
          );

        const serverSignature =
          serverMessages
            .map((msg) =>
              [
                String(
                  msg.id || ""
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

          setMessages(
            serverMessages
          );
        }

        /*
         * Mark conversation as read
         */
        if (firstLoad) {
          await markConversationAsRead(
            selectedUserId
          );
        }
      } catch (error) {
        console.error(
          "Load messages error:",
          error
        );

        if (
          firstLoad &&
          !cancelled
        ) {
          console.error(
            "Could not load messages:",
            error.message
          );
        }
      } finally {
        if (
          firstLoad &&
          !cancelled
        ) {
          setLoadingMessages(false);
        }
      }

      firstLoad = false;
    }

    loadMessages();

    /*
     * Keep messages updated.
     * Socket handles real-time delivery,
     * this also keeps the conversation synced.
     */
    intervalId =
      setInterval(
        loadMessages,
        1500
      );

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(
          intervalId
        );
      }
    };
  }, [
    apiUrl,
    selectedUserId,
  ]);

  /* =====================================================
     MARK CONVERSATION READ
  ===================================================== */

  async function markConversationAsRead(
    userId
  ) {
    const token = getToken();

    if (!token || !userId) {
      return;
    }

    try {
      const response =
        await fetch(
          `${apiUrl}/messages/${userId}/read`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        return;
      }

      /*
       * Remove unread badge
       */
      if (setUnreadCounts) {
        setUnreadCounts(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[
              String(userId)
            ];

            return updated;
          }
        );
      }

      /*
       * Update received messages as read
       */
      setMessages(
        (previousMessages) =>
          previousMessages.map(
            (msg) => {
              if (
                msg.type ===
                "received"
              ) {
                return {
                  ...msg,
                  read: true,
                };
              }

              return msg;
            }
          )
      );

      /*
       * Tell socket that conversation
       * has been read.
       */
      if (
        socketRef?.current
      ) {
        socketRef.current.emit(
          "messagesRead",
          {
            userId:
              String(userId),
          }
        );
      }
    } catch (error) {
      console.error(
        "Mark read error:",
        error
      );
    }
  }

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  async function sendMessage(
    text
  ) {
    const cleanMessage =
      String(text || "").trim();

    if (!cleanMessage) {
      return false;
    }

    if (!selectedUserId) {
      return false;
    }

    const token = getToken();

    if (!token) {
      throw new Error(
        "Please login again."
      );
    }

    try {
      const response =
        await fetch(
          `${apiUrl}/messages`,
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
                cleanMessage,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not send message."
        );
      }

      const createdMessage =
        data.message;

      if (!createdMessage) {
        throw new Error(
          "Server did not return the created message."
        );
      }

      const formattedMessage =
        formatMessage(
          createdMessage
        );

      /*
       * Add sent message immediately
       */
      setMessages(
        (previousMessages) => {
          const newId =
            String(
              formattedMessage.id
            );

          const alreadyExists =
            previousMessages.some(
              (msg) =>
                String(msg.id) ===
                newId
            );

          if (alreadyExists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            {
              ...formattedMessage,
              type: "sent",
            },
          ];
        }
      );

      /*
       * Update user's last message
       */
      if (setUsers) {
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
                  String(
                    selectedUserId
                  )
                ) {
                  return user;
                }

                return {
                  ...user,

                  lastMessage:
                    cleanMessage,

                  time:
                    formattedMessage.time ||
                    "",
                };
              }
            )
        );
      }

      /*
       * Send real-time message
       * to receiver.
       */
      if (
        socketRef?.current
      ) {
        socketRef.current.emit(
          "sendMessage",
          {
            ...createdMessage,

            id:
              createdMessage.id ||
              createdMessage._id,

            sender:
              createdMessage.sender,

            receiver:
              selectedUserId,

            text:
              createdMessage.text ||
              cleanMessage,

            createdAt:
              createdMessage.createdAt,
          }
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      throw error;
    }
  }

  /* =====================================================
     DELETE MESSAGE
  ===================================================== */

  async function deleteMessage(
    messageId
  ) {
    if (!messageId) {
      return false;
    }

    const shouldDelete =
      window.confirm(
        "Delete this message?"
      );

    if (!shouldDelete) {
      return false;
    }

    const token = getToken();

    if (!token) {
      throw new Error(
        "Please login again."
      );
    }

    try {
      const response =
        await fetch(
          `${apiUrl}/messages/message/${messageId}`,
          {
            method: "DELETE",

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
            "Could not delete message."
        );
      }

      /*
       * Remove locally
       */
      setMessages(
        (previousMessages) =>
          previousMessages.filter(
            (msg) =>
              String(msg.id) !==
              String(messageId)
          )
      );

      /*
       * Tell other side
       */
      if (
        socketRef?.current
      ) {
        socketRef.current.emit(
          "deleteMessage",
          {
            messageId:
              String(messageId),
          }
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Delete message error:",
        error
      );

      throw error;
    }
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    messages,
    setMessages,

    loadingMessages,
    setLoadingMessages,

    markConversationAsRead,

    sendMessage,

    deleteMessage,
  };
}

export default useMessages;