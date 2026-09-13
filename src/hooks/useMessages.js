import { useEffect, useState } from "react";

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

  const [sending, setSending] =
    useState(false);

  async function markConversationAsRead(
    senderId
  ) {
    if (!senderId) {
      return;
    }

    const senderIdString =
      String(senderId);

    setUnreadCounts((previous) => {
      const updated = {
        ...previous,
      };

      delete updated[senderIdString];

      return updated;
    });

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        "markRead",
        {
          senderId:
            senderIdString,
        }
      );
    }

    const token =
      sessionStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      await fetch(
        `${apiUrl}/messages/${senderIdString}/read`,
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
        sessionStorage.getItem("token");

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
          data.messages || [];

        const serverSignature =
          serverMessages
            .map((msg) =>
              [
                String(
                  msg.id ||
                    msg._id ||
                    ""
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

          await markConversationAsRead(
            selectedUserId
          );
        }
      } catch (error) {
        console.error(
          "Load messages error:",
          error
        );
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
  }, [
    apiUrl,
    selectedUserId,
  ]);

  async function deleteMessage(
    messageId
  ) {
    if (!messageId) {
      return;
    }

    const shouldDelete =
      window.confirm(
        "Delete this message?"
      );

    if (!shouldDelete) {
      return;
    }

    const token =
      sessionStorage.getItem("token");

    if (!token) {
      return;
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

      setMessages(
        (previousMessages) =>
          previousMessages.filter(
            (msg) =>
              String(msg.id) !==
              String(messageId)
          )
      );
    } catch (error) {
      console.error(
        "Delete message error:",
        error
      );

      throw error;
    }
  }

  async function sendMessage(
    messageText
  ) {
    if (!messageText.trim()) {
      return false;
    }

    if (!selectedUserId) {
      return false;
    }

    const token =
      sessionStorage.getItem("token");

    if (!token) {
      return false;
    }

    setSending(true);

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
                messageText.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Message could not be sent."
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

      return true;
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      setSending(false);
    }
  }

  return {
    messages,
    setMessages,

    loadingMessages,
    sending,

    markConversationAsRead,
    sendMessage,
    deleteMessage,
  };
}

export default useMessages;