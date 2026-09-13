import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

function useChatSocket({
  socketUrl,
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
}) {
  const usersRef = useRef(users);
  const markReadRef = useRef(
    markConversationAsRead
  );

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    markReadRef.current =
      markConversationAsRead;
  }, [markConversationAsRead]);

  useEffect(() => {
    const token =
      sessionStorage.getItem("token");

    if (!token || !currentUserId) {
      return;
    }

    const socket = io(socketUrl, {
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

      const userId =
        currentUser?.id ||
        currentUser?._id;

      const saved = userId
        ? localStorage.getItem(
            `showOnline_${userId}`
          )
        : null;

      socket.emit("join", {
        showOnline:
          saved !== "false",
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

    socket.on(
      "presenceSnapshot",
      ({ onlineUsers: list = [] }) => {
        setOnlineUsers(
          list.map(String)
        );
      }
    );

    socket.on(
      "presenceUpdate",
      ({ onlineUsers: list = [] }) => {
        setOnlineUsers(
          list.map(String)
        );
      }
    );

    socket.on(
      "newMessage",
      (newMessage) => {
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
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          createdAt:
            newMessage.createdAt,
          read: Boolean(
            newMessage.read
          ),
        };

        const selected =
          selectedUserRef.current;

        const selectedId = String(
          selected?.id ||
            selected?._id ||
            ""
        );

        if (senderId === selectedId) {
          setMessages(
            (previous) => {
              const exists =
                previous.some(
                  (msg) =>
                    String(msg.id) ===
                    messageId
                );

              if (exists) {
                return previous;
              }

              return [
                ...previous,
                formattedMessage,
              ];
            }
          );

          markReadRef.current(
            senderId
          );

          return;
        }

        if (
          typeof window !==
            "undefined" &&
          "Notification" in window &&
          Notification.permission ===
            "granted" &&
          typeof document !==
            "undefined" &&
          document.visibilityState !==
            "visible"
        ) {
          const sender =
            usersRef.current.find(
              (user) =>
                String(
                  user.id ||
                    user._id
                ) === senderId
            );

          try {
            new Notification(
              sender?.name ||
                `@${sender?.username}` ||
                "New message",
              {
                body:
                  newMessage.text,
                icon:
                  sender?.photo ||
                  undefined,
                tag: `message-${senderId}`,
              }
            );
          } catch (error) {
            console.error(
              "Browser notification error:",
              error
            );
          }
        }

        setUnreadCounts(
          (previous) => ({
            ...previous,
            [senderId]:
              (previous[senderId] ||
                0) + 1,
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
                        minute:
                          "2-digit",
                      }
                    ),
                };
              }
            )
        );
      }
    );

    socket.on(
      "messageDeleted",
      ({ messageId }) => {
        setMessages(
          (previous) =>
            previous.filter(
              (msg) =>
                String(msg.id) !==
                String(messageId)
            )
        );
      }
    );

    socket.on(
      "userTyping",
      ({ userId, isTyping }) => {
        const typingId =
          String(userId);

        const selected =
          selectedUserRef.current;

        const selectedId =
          String(
            selected?.id ||
              selected?._id ||
              ""
          );

        if (
          typingId !==
          selectedId
        ) {
          return;
        }

        setTypingUserId(
          isTyping
            ? typingId
            : null
        );
      }
    );

    socket.on(
      "messagesRead",
      ({ userId }) => {
        const readerId =
          String(userId);

        const selected =
          selectedUserRef.current;

        const selectedId =
          String(
            selected?.id ||
              selected?._id ||
              ""
          );

        if (
          readerId !==
          selectedId
        ) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (msg) =>
                msg.type === "sent"
                  ? {
                      ...msg,
                      read: true,
                    }
                  : msg
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
  }, [
    socketUrl,
    currentUserId,
  ]);
}

export default useChatSocket;