const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");

const {
  Server,
} = require("socket.io");

const jwt =
  require("jsonwebtoken");

const Message =
  require("./models/Message");


dotenv.config({
  path:
    path.join(
      __dirname,
      ".env"
    ),
});


const app =
  express();


// =====================================================
// HTTP SERVER
// =====================================================

const server =
  http.createServer(app);


// =====================================================
// SOCKET.IO
// =====================================================

const io =
  new Server(
    server,
    {
      cors: {
        origin:
          "http://localhost:5173",

        methods: [
          "GET",
          "POST",
        ],
      },
    }
  );


app.set(
  "io",
  io
);


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors()
);

app.use(
  express.json()
);


// =====================================================
// MONGODB
// =====================================================

mongoose
  .connect(
    "mongodb://localhost:27017/messaging_app"
  )

  .then(() => {

    console.log(
      "MongoDB connected successfully!"
    );

  })

  .catch(
    (error) => {

      console.error(
        "MongoDB connection failed:"
      );

      console.error(
        error.message
      );

    }
  );


// =====================================================
// ROUTES
// =====================================================

const authRoutes =
  require("./routes/auth");

const messageRoutes =
  require("./routes/messages");


app.use(
  "/api/auth",
  authRoutes
);


app.use(
  "/api/messages",
  messageRoutes
);


// =====================================================
// HOME
// =====================================================

app.get(
  "/",
  (req, res) => {

    res.json({
      success: true,

      message:
        "Messaging App Backend is running!",
    });

  }
);


// =====================================================
// ONLINE USERS
// =====================================================

// userId => {
//   sockets: Set(),
//   visible: true/false
// }

const onlineUsers =
  new Map();


// =====================================================
// SOCKET AUTHENTICATION
// =====================================================

io.use(
  (socket, next) => {

    try {

      const token =
        socket.handshake.auth?.token;


      if (!token) {
        return next(
          new Error(
            "Authentication required."
          )
        );
      }


      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );


      socket.userId =
        decoded.userId.toString();


      next();

    } catch (error) {

      next(
        new Error(
          "Invalid socket authentication."
        )
      );

    }

  }
);


// =====================================================
// BROADCAST PRESENCE
// =====================================================

function getVisibleOnlineUsers() {

  const users = [];

  for (
    const [
      userId,
      data,
    ] of onlineUsers.entries()
  ) {

    if (
      data.visible &&
      data.sockets.size > 0
    ) {

      users.push(
        userId
      );

    }

  }

  return users;
}


function broadcastPresence() {

  io.emit(
    "presenceUpdate",
    {
      onlineUsers:
        getVisibleOnlineUsers(),
    }
  );

}


// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on(
  "connection",
  (socket) => {

    const userId =
      socket.userId;


    console.log(
      "User connected:",
      socket.id,
      "User:",
      userId
    );


    // ================================================
    // JOIN
    // ================================================

    socket.on(
      "join",
      ({
        showOnline = true,
      } = {}) => {

        socket.join(
          userId
        );


        if (
          !onlineUsers.has(
            userId
          )
        ) {

          onlineUsers.set(
            userId,
            {
              sockets:
                new Set(),

              visible:
                Boolean(
                  showOnline
                ),
            }
          );

        }


        const userData =
          onlineUsers.get(
            userId
          );


        userData.sockets.add(
          socket.id
        );


        userData.visible =
          Boolean(
            showOnline
          );


        socket.emit(
          "presenceSnapshot",
          {
            onlineUsers:
              getVisibleOnlineUsers(),
          }
        );


        broadcastPresence();


        console.log(
          `User ${userId} joined their room`
        );

      }
    );


    // ================================================
    // CHANGE ONLINE VISIBILITY
    // ================================================

    socket.on(
      "setPresence",
      ({
        showOnline,
      } = {}) => {

        const userData =
          onlineUsers.get(
            userId
          );


        if (!userData) {
          return;
        }


        userData.visible =
          Boolean(
            showOnline
          );


        broadcastPresence();

      }
    );


    // ================================================
    // TYPING
    // ================================================

    socket.on(
      "typing",
      ({
        receiverId,
        isTyping,
      }) => {

        if (!receiverId) {
          return;
        }


        io.to(
          receiverId.toString()
        ).emit(
          "userTyping",
          {
            userId:
              userId,

            isTyping:
              Boolean(
                isTyping
              ),
          }
        );

      }
    );


    // ================================================
    // MARK MESSAGES READ
    // ================================================

    socket.on(
      "markRead",
      async ({
        senderId,
      }) => {

        if (!senderId) {
          return;
        }


        try {

          const result =
            await Message.updateMany(

              {
                sender:
                  senderId,

                receiver:
                  userId,

                read:
                  false,
              },

              {
                $set: {
                  read:
                    true,

                  readAt:
                    new Date(),
                },
              }

            );


          if (
            result.modifiedCount >
            0
          ) {

            io.to(
              senderId.toString()
            ).emit(
              "messagesRead",
              {
                userId:
                  userId,

                count:
                  result.modifiedCount,
              }
            );

          }

        } catch (error) {

          console.error(
            "Socket mark read error:",
            error
          );

        }

      }
    );


    // ================================================
    // DISCONNECT
    // ================================================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "User disconnected:",
          socket.id,
          "User:",
          userId
        );


        const userData =
          onlineUsers.get(
            userId
          );


        if (!userData) {
          return;
        }


        userData.sockets.delete(
          socket.id
        );


        if (
          userData.sockets.size ===
          0
        ) {

          onlineUsers.delete(
            userId
          );

        }


        broadcastPresence();

      }
    );

  }
);


// =====================================================
// START SERVER
// =====================================================

const PORT = 5000;


server.listen(
  PORT,
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );


    console.log(
      "JWT Secret loaded:",
      process.env.JWT_SECRET
        ? "YES"
        : "NO"
    );

  }
);