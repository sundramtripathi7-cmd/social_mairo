import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { EVERYONE_GROUP_ID } from "../constants/group";
import { getToken } from "../utils/authStorage";

function useChatSocket({
  socketUrl,
  currentUserId,
  users,
  selectedUserRef,
  markConversationAsRead,
  setMessages,
  setUnreadCounts,
  setUsers,
  setOnlineUsers,
  setSelectedUser,
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
      getToken();

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

      socket.emit("join");
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

    socket.on("userDeleted", ({ userId }) => {
      const deletedId = String(userId || "");

      if (!deletedId) {
        return;
      }

      setUsers((previousUsers) =>
        previousUsers.filter((user) => {
          return (
            String(user.id || user._id) !==
            deletedId
          );
        })
      );

      setOnlineUsers((previous) =>
        previous.filter((id) => id !== deletedId)
      );

      const selected = selectedUserRef.current;

      if (
        selected &&
        String(selected.id || selected._id) ===
          deletedId
      ) {
        selectedUserRef.current = null;
        setSelectedUser?.(null);
      }
    });

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

    socket.on("groupMessage", (incoming) => {
      const senderId = String(incoming.sender || "");
      const messageId = String(
        incoming.id || incoming._id
      );
      const isOwn = senderId === String(currentUserId);

      const formattedMessage = {
        id: messageId,
        text: incoming.text,
        type: isOwn ? "sent" : "received",
        time:
          incoming.time ||
          new Date(incoming.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        createdAt: incoming.createdAt,
        senderUsername: incoming.senderUsername || "",
        senderPhoto: incoming.senderPhoto || "",
        group: EVERYONE_GROUP_ID,
      };

      const selected = selectedUserRef.current;
      const selectedId = String(
        selected?.id || selected?._id || ""
      );

      if (selectedId === EVERYONE_GROUP_ID) {
        setMessages((previous) => {
          const exists = previous.some(
            (msg) => String(msg.id) === messageId
          );

          if (exists) {
            return previous;
          }

          return [...previous, formattedMessage];
        });

        if (!isOwn) {
          markReadRef.current(EVERYONE_GROUP_ID);
        }

        return;
      }

      if (isOwn) {
        return;
      }

      setUnreadCounts((previous) => ({
        ...previous,
        [EVERYONE_GROUP_ID]:
          (previous[EVERYONE_GROUP_ID] || 0) + 1,
      }));
    });

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