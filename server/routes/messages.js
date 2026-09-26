const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/user");
const GroupRead = require("../models/GroupRead");
const {
  EVERYONE_GROUP_ID,
  EVERYONE_ROOM,
} = require("../constants/group");

const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

// =====================================================
// SEND MESSAGE
// =====================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Receiver and message are required.",
      });
    }

    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      text: text.trim(),
      read: false,
    });

    const formattedMessage = {
      id: message._id,
      text: message.text,
      type: "received",
      time: new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: message.createdAt,
      sender: message.sender,
      receiver: message.receiver,
      read: message.read,
    };

    const io = req.app.get("io");

    if (io) {
      io.to(receiverId.toString()).emit(
        "newMessage",
        formattedMessage
      );
    }

    return res.status(201).json({
      success: true,
      message: {
        id: message._id,
        sender: message.sender,
        receiver: message.receiver,
        text: message.text,
        createdAt: message.createdAt,
        read: message.read,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not send message.",
    });
  }
});

// =====================================================
// UNREAD COUNTS
// IMPORTANT: before /:userId
// =====================================================

router.get(
  "/unread/counts",
  authenticateToken,
  async (req, res) => {
    try {
      const unreadMessages = await Message.find({
        receiver: req.userId,
        read: false,
      }).select("sender");

      const counts = {};

      unreadMessages.forEach((message) => {
        const senderId = message.sender.toString();

        counts[senderId] =
          (counts[senderId] || 0) + 1;
      });

      const readState = await GroupRead.findOne({
        user: req.userId,
      }).select("lastReadAt");

      const since = readState?.lastReadAt || new Date(0);

      const groupUnread = await Message.countDocuments({
        group: EVERYONE_GROUP_ID,
        sender: { $ne: req.userId },
        createdAt: { $gt: since },
      });

      if (groupUnread > 0) {
        counts[EVERYONE_GROUP_ID] = groupUnread;
      }

      return res.json({
        success: true,
        counts,
      });
    } catch (error) {
      console.error(
        "Unread count error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Could not load unread counts.",
      });
    }
  }
);

router.get(
  "/group",
  authenticateToken,
  async (req, res) => {
    try {
      const messages = await Message.find({
        group: EVERYONE_GROUP_ID,
      })
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("sender", "username photo");

      messages.reverse();

      return res.json({
        success: true,
        group: {
          id: EVERYONE_GROUP_ID,
          name: "Everyone",
        },
        messages: messages.map((message) =>
          formatGroupMessage(message, req.userId)
        ),
      });
    } catch (error) {
      console.error("Get group messages error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not load the group chat.",
      });
    }
  }
);

router.post(
  "/group",
  authenticateToken,
  async (req, res) => {
    try {
      const text = String(req.body?.text || "").trim();

      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Message is required.",
        });
      }

      if (text.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Message is too long.",
        });
      }

      const sender = await User.findById(req.userId).select(
        "username photo"
      );

      if (!sender) {
        return res.status(404).json({
          success: false,
          message: "Account not found.",
        });
      }

      const message = await Message.create({
        sender: req.userId,
        group: EVERYONE_GROUP_ID,
        text,
        read: false,
      });

      const formatted = formatGroupMessage(
        {
          ...message.toObject(),
          sender,
        },
        req.userId
      );

      const io = req.app.get("io");

      if (io) {
        io.to(EVERYONE_ROOM).emit("groupMessage", {
          ...formatted,
          type: "received",
        });
      }

      return res.status(201).json({
        success: true,
        message: formatted,
      });
    } catch (error) {
      console.error("Send group message error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not send the group message.",
      });
    }
  }
);

router.post(
  "/group/read",
  authenticateToken,
  async (req, res) => {
    try {
      await GroupRead.findOneAndUpdate(
        { user: req.userId },
        { $set: { lastReadAt: new Date() } },
        { upsert: true }
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error("Group read error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not update the group chat.",
      });
    }
  }
);

function formatGroupMessage(message, currentUserId) {
  const sender = message.sender || {};
  const senderId = String(sender._id || sender);

  return {
    id: message._id,
    text: message.text,
    type:
      senderId === String(currentUserId)
        ? "sent"
        : "received",
    time: new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt: message.createdAt,
    sender: senderId,
    senderUsername: sender.username || "",
    senderPhoto: sender.photo || "",
    group: EVERYONE_GROUP_ID,
  };
}

// =====================================================
// DELETE MESSAGE
// =====================================================

router.delete(
  "/message/:messageId",
  authenticateToken,
  async (req, res) => {
    try {
      const { messageId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID.",
        });
      }

      const message = await Message.findOne({
        _id: messageId,
        sender: req.userId,
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Message not found or you are not allowed to delete it.",
        });
      }

      await Message.deleteOne({
        _id: messageId,
      });

      const io = req.app.get("io");

      if (io) {
        const payload = {
          messageId: messageId,
        };

        if (message.group) {
          io.to(EVERYONE_ROOM).emit(
            "messageDeleted",
            payload
          );
        } else if (message.receiver) {
          const receiverId = message.receiver.toString();

          io.to(receiverId).emit(
            "messageDeleted",
            payload
          );

          io.to(req.userId.toString()).emit(
            "messageDeleted",
            payload
          );
        }
      }

      return res.json({
        success: true,
        message: "Message deleted successfully.",
        messageId: messageId,
      });
    } catch (error) {
      console.error(
        "Delete message error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Could not delete message.",
      });
    }
  }
);

// =====================================================
// GET CONVERSATION
// =====================================================

router.get(
  "/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const otherUserId =
        req.params.userId;

      const messages =
        await Message.find({
          $or: [
            {
              sender: req.userId,
              receiver: otherUserId,
            },
            {
              sender: otherUserId,
              receiver: req.userId,
            },
          ],
        }).sort({
          createdAt: 1,
        });

      const formattedMessages =
        messages.map((message) => ({
          id: message._id,
          text: message.text,

          type:
            message.sender.toString() ===
            req.userId.toString()
              ? "sent"
              : "received",

          time: new Date(
            message.createdAt
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),

          createdAt:
            message.createdAt,

          read:
            message.read,
        }));

      return res.json({
        success: true,
        messages:
          formattedMessages,
      });
    } catch (error) {
      console.error(
        "Get messages error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Could not load messages.",
      });
    }
  }
);

// =====================================================
// MARK CONVERSATION READ
// =====================================================

router.post(
  "/:userId/read",
  authenticateToken,
  async (req, res) => {
    try {
      const otherUserId =
        req.params.userId;

      const result =
        await Message.updateMany(
          {
            sender: otherUserId,
            receiver: req.userId,
            read: false,
          },
          {
            $set: {
              read: true,
              readAt: new Date(),
            },
          }
        );

      const io =
        req.app.get("io");

      if (io) {
        io.to(
          otherUserId.toString()
        ).emit(
          "messagesRead",
          {
            userId: req.userId,
            count:
              result.modifiedCount,
          }
        );
      }

      return res.json({
        success: true,
        updated:
          result.modifiedCount,
      });
    } catch (error) {
      console.error(
        "Mark read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not mark messages as read.",
      });
    }
  }
);

module.exports = router;