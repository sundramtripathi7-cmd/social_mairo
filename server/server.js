const path = require("path");
const dns = require("dns");
const postRoutes = require("./routes/postRoutes");
const feedRoutes = require("./routes/feedRoutes");

const dnsServers = ["1.1.1.1", "8.8.8.8"];

try {
  dns.setServers(dnsServers);
} catch (error) {
  console.log("DNS setup warning:", error.message);
}

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");

const app = express();

const server = http.createServer(app);

/* =====================================================
   CORS
===================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",

  "https://social-mairo.vercel.app",
  "https://social-mairo-git-main-sundramtripathi7-cmds-projects.vercel.app",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  })
);

/* =====================================================
   BODY PARSER
===================================================== */

app.use(
  express.json({
    limit: "15mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);

/* =====================================================
   SOCKET.IO
===================================================== */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    credentials: true,
  },
});

/* =====================================================
   MODELS
===================================================== */

const User = require("./models/user");
const Message = require("./models/Message");
const {
  EVERYONE_ROOM,
} = require("./constants/group");
const Post = require("./models/Post");

/* =====================================================
   BASIC ROUTE
===================================================== */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Messaging App API is running",
  });
});

/* =====================================================
   API ROUTES
===================================================== */

app.set("io", io);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/feed", feedRoutes);

/* =====================================================
   JWT CHECK FOR SOCKET.IO
===================================================== */

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication token required")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.userId = String(
      decoded.id ||
        decoded.userId ||
        decoded._id
    );

    if (!socket.userId) {
      return next(
        new Error("Invalid authentication token")
      );
    }

    next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error.message
    );

    next(
      new Error("Invalid authentication token")
    );
  }
});

/* =====================================================
   ONLINE USERS
===================================================== */

/*
  userId -> active socket id
  Connected users are always shown as online.
*/

const onlineUsers = new Map();

function getPublicOnlineUsers() {
  return Array.from(onlineUsers.keys()).map(String);
}

/* =====================================================
   BROADCAST PRESENCE
===================================================== */

function broadcastPresence() {
  const publicOnlineUsers =
    getPublicOnlineUsers();

  io.emit("presenceUpdate", {
    onlineUsers: publicOnlineUsers,
  });
}

/* =====================================================
   SOCKET CONNECTION
===================================================== */

io.on("connection", (socket) => {
  console.log(
    "Socket connected:",
    socket.id,
    "User:",
    socket.userId
  );

  /* ===================================================
     JOIN
  =================================================== */

  socket.on("join", () => {
    const userId = String(socket.userId);

    onlineUsers.set(userId, socket.id);

    /*
      Put user in personal room.
    */

    socket.join(`user_${userId}`);
    socket.join(EVERYONE_ROOM);

    /*
      Send current presence snapshot
      to this newly connected user.
    */

    socket.emit("presenceSnapshot", {
      onlineUsers: getPublicOnlineUsers(),
    });

    /*
      Tell everyone else about new presence.
    */

    broadcastPresence();

    console.log("User joined:", userId);
  });

  /* ===================================================
     TYPING
  =================================================== */

  socket.on(
    "typing",
    ({ receiverId, isTyping }) => {
      if (!receiverId) {
        return;
      }

      const receiverIdString =
        String(receiverId);

      io.to(`user_${receiverIdString}`).emit(
        "userTyping",
        {
          userId: String(socket.userId),
          isTyping: Boolean(isTyping),
        }
      );
    }
  );

  /* ===================================================
     MARK READ
  =================================================== */

  socket.on(
    "markRead",
    async ({ senderId }) => {
      try {
        if (!senderId) {
          return;
        }

        const senderIdString =
          String(senderId);

        const receiverIdString =
          String(socket.userId);

        /*
          Mark all messages from sender
          to current user as read.
        */

        await Message.updateMany(
          {
            sender: senderIdString,
            receiver: receiverIdString,
            read: false,
          },
          {
            $set: {
              read: true,
              readAt: new Date(),
            },
          }
        );

        /*
          Inform sender that their messages
          have been read.
        */

        io.to(`user_${senderIdString}`).emit(
          "messagesRead",
          {
            userId: receiverIdString,
          }
        );

        console.log(
          "Messages marked as read:",
          senderIdString,
          "->",
          receiverIdString
        );
      } catch (error) {
        console.error(
          "Socket markRead error:",
          error
        );
      }
    }
  );

  /* ===================================================
     DISCONNECT
  =================================================== */

  socket.on("disconnect", () => {
    const userId = String(socket.userId);

    const existing =
      onlineUsers.get(userId);

    /*
      Only remove the user if this socket
      is still the active socket.
    */

    if (existing === socket.id) {
      onlineUsers.delete(userId);
    }

    console.log(
      "Socket disconnected:",
      socket.id,
      "User:",
      userId
    );

    broadcastPresence();
  });
});

/* =====================================================
   MONGODB CONNECTION
===================================================== */

const MONGO_URI =
  process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(
    "ERROR: MONGO_URI is missing from .env"
  );

  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error(
    "ERROR: JWT_SECRET is missing from .env"
  );

  process.exit(1);
}

console.log(
  "JWT Secret loaded:",
  process.env.JWT_SECRET
    ? "YES"
    : "NO"
);

async function cleanupExpiredFeedPosts() {
  try {
    const oldestAllowed = new Date(
      Date.now() - Post.STATUS_TTL_MS
    );

    const result = await Post.deleteMany({
      $or: [
        { expiresAt: { $lte: new Date() } },
        { createdAt: { $lte: oldestAllowed } },
      ],
    });

    if (result.deletedCount > 0) {
      console.log(
        `Auto-deleted ${result.deletedCount} expired status update(s).`
      );
    }

    /*
      Backfill older posts that were created
      before expiresAt existed (24 hours from createdAt).
    */
    const postsMissingExpiry = await Post.find({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
      ],
    }).select("_id createdAt");

    for (const post of postsMissingExpiry) {
      const expiresAt = Post.getDefaultExpiresAt(
        post.createdAt || new Date()
      );

      if (expiresAt <= new Date()) {
        await Post.findByIdAndDelete(post._id);
      } else {
        await Post.updateOne(
          { _id: post._id },
          { $set: { expiresAt } }
        );
      }
    }
  } catch (error) {
    console.error(
      "Feed auto-delete cleanup error:",
      error.message
    );
  }
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(
      "MongoDB connected successfully!"
    );

    await cleanupExpiredFeedPosts();

    /* Run every hour so expired statuses are removed. */
    setInterval(
      cleanupExpiredFeedPosts,
      60 * 60 * 1000
    );

    /* ===============================================
       START SERVER
    =============================================== */

    const PORT =
      process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );

      console.log(
        `API: http://localhost:${PORT}/api`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:",
      error
    );

    process.exit(1);
  });

/* =====================================================
   HANDLE SERVER ERRORS
===================================================== */

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${process.env.PORT || 5000} is already in use.`
    );

    console.error(
      "Another server instance may already be running."
    );

    return;
  }

  console.error(
    "Server error:",
    error
  );
});
