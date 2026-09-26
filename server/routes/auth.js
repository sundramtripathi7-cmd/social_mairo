const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { sendOTP } = require("../mailer");
const OTP = require("../models/otp");
const Message = require("../models/Message");
const Post = require("../models/Post");
const FeedPost = require("../models/FeedPost");
const GroupRead = require("../models/GroupRead");
const { cleanInterests } = require("../constants/interests");

const router = express.Router();

const COLLEGE_DOMAIN = "@iiitvadodara.ac.in";
const OTP_EXPIRY_MINUTES = 10;

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

function cleanUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isCollegeEmail(email) {
  return email.toLowerCase().trim().endsWith(COLLEGE_DOMAIN);
}

function publicUser(user, { includeEmail = true } = {}) {
  const payload = {
    id: user._id,
    username: user.username || "",
    gender: user.gender || "",
    photo: user.photo || "",
    interests: Array.isArray(user.interests)
      ? user.interests
      : [],
  };

  if (includeEmail) {
    payload.email = user.email;
  }

  return payload;
}

/* =====================================================
   SEND OTP
===================================================== */

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isCollegeEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Only IIIT Vadodara student email IDs are allowed.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    await OTP.deleteMany({
      email: cleanEmail,
    });

    await OTP.create({
      email: cleanEmail,
      otp,
      expiresAt,
      verified: false,
    });

    await sendOTP(cleanEmail, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not send OTP.",
    });
  }
});

/* =====================================================
   VERIFY OTP
===================================================== */

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOTP = String(otp).trim();

    if (!isCollegeEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Only IIIT Vadodara student email IDs are allowed.",
      });
    }

    const otpRecord = await OTP.findOne({
      email: cleanEmail,
      otp: cleanOTP,
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not verify OTP.",
    });
  }
});

/* =====================================================
   REGISTER
===================================================== */

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      gender,
      interests,
    } = req.body;

    if (!username || !email || !password || !gender) {
      return res.status(400).json({
        success: false,
        message:
          "Username, email, password and gender are required.",
      });
    }

    const cleanGender = String(gender)
      .trim()
      .toLowerCase();

    if (!["male", "female"].includes(cleanGender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be male or female.",
      });
    }

    const cleanedInterests = cleanInterests(
      interests || []
    );

    if (cleanedInterests.error) {
      return res.status(400).json({
        success: false,
        message: cleanedInterests.error,
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters.",
      });
    }

    const finalUsername = cleanUsername(username);

    if (!/^[a-zA-Z0-9_.]+$/.test(finalUsername)) {
      return res.status(400).json({
        success: false,
        message:
          "Username can contain only letters, numbers, underscore and dot.",
      });
    }

    if (
      finalUsername.length < 3 ||
      finalUsername.length > 30
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be between 3 and 30 characters.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isCollegeEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Only IIIT Vadodara student email IDs are allowed.",
      });
    }

    /* =================================================
       CHECK EMAIL VERIFICATION
    ================================================= */

    const verifiedOTP = await OTP.findOne({
      email: cleanEmail,
      verified: true,
    });

    if (!verifiedOTP) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your college email with OTP first.",
      });
    }

    if (verifiedOTP.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: verifiedOTP._id,
      });

      return res.status(403).json({
        success: false,
        message:
          "Email verification has expired. Please request a new OTP.",
      });
    }

    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const existingUsername = await User.findOne({
      username: finalUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      username: finalUsername,
      email: cleanEmail,
      password: hashedPassword,
      gender: cleanGender,
      photo: "",
      interests: cleanedInterests.interests,
    });

    await OTP.deleteOne({
      _id: verifiedOTP._id,
    });

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      if (error.keyPattern?.username) {
        return res.status(409).json({
          success: false,
          message: "This username is already taken.",
        });
      }

      if (error.keyPattern?.email) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

/* =====================================================
   LOGIN
===================================================== */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

/* =====================================================
   CURRENT USER
===================================================== */

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(
      req.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not load profile.",
    });
  }
});

/* =====================================================
   UPDATE PROFILE
===================================================== */

router.patch(
  "/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        username,
        photo,
        gender,
        interests,
      } = req.body;

      let finalUsername;

      if (username !== undefined) {
        finalUsername =
          cleanUsername(username);

        if (!finalUsername) {
          return res.status(400).json({
            success: false,
            message:
              "Username cannot be empty.",
          });
        }

        if (
          !/^[a-zA-Z0-9_.]+$/.test(
            finalUsername
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Username can contain only letters, numbers, underscore and dot.",
          });
        }

        if (
          finalUsername.length < 3 ||
          finalUsername.length > 30
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Username must be between 3 and 30 characters.",
          });
        }

        const usernameTaken =
          await User.findOne({
            username: finalUsername,
            _id: { $ne: req.userId },
          });

        if (usernameTaken) {
          return res.status(409).json({
            success: false,
            message:
              "This username is already taken.",
          });
        }
      }

      if (
        photo !== undefined &&
        typeof photo !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile photo.",
        });
      }

      if (gender !== undefined) {
        const cleanGender = String(gender)
          .trim()
          .toLowerCase();

        if (
          !["male", "female"].includes(
            cleanGender
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Gender must be male or female.",
          });
        }
      }

      let cleanedInterests;

      if (interests !== undefined) {
        cleanedInterests = cleanInterests(interests);

        if (cleanedInterests.error) {
          return res.status(400).json({
            success: false,
            message: cleanedInterests.error,
          });
        }
      }

      const updateData = {};

      if (username !== undefined) {
        updateData.username = finalUsername;
      }

      if (photo !== undefined) {
        updateData.photo = photo;
      }

      if (gender !== undefined) {
        updateData.gender = String(gender)
          .trim()
          .toLowerCase();
      }

      if (cleanedInterests) {
        updateData.interests =
          cleanedInterests.interests;
      }

      const updatedUser =
        await User.findByIdAndUpdate(
          req.userId,
          { $set: updateData },
          {
            new: true,
            runValidators: true,
          }
        ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Profile updated successfully.",
        user: publicUser(updatedUser),
      });
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "This username is already taken.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Could not update profile.",
      });
    }
  }
);

/* =====================================================
   GET ALL USERS
===================================================== */

router.get(
  "/users",
  authenticateToken,
  async (req, res) => {
    try {
      const users = await User.find(
        {
          _id: { $ne: req.userId },
        },
        {
          password: 0,
          email: 0,
        }
      ).sort({
        username: 1,
      });

      const formattedUsers =
        users.map((user) => ({
          ...publicUser(user, {
            includeEmail: false,
          }),
          initial:
            user.username
              ?.charAt(0)
              .toUpperCase() || "?",
          online: false,
          lastMessage:
            "Start a conversation",
          time: "",
        }));

      return res.json({
        success: true,
        users: formattedUsers,
      });
    } catch (error) {
      console.error(
        "Get users error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not load users.",
      });
    }
  }
);

/*
  DELETE ACCOUNT PERMANENTLY
  DELETE /api/auth/account
*/
router.delete(
  "/account",
  authenticateToken,
  async (req, res) => {
    try {
      const password = String(
        req.body?.password || ""
      );

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "Enter your password to delete your account.",
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Account not found.",
        });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Password is incorrect.",
        });
      }

      const userId = user._id;

      await Message.deleteMany({
        $or: [
          { sender: userId },
          { receiver: userId },
        ],
      });

      await GroupRead.deleteOne({ user: userId });

      await Post.deleteMany({ author: userId });
      await FeedPost.deleteMany({ author: userId });

      await Post.updateMany(
        {},
        {
          $pull: {
            likes: userId,
            viewers: userId,
          },
        }
      );

      await FeedPost.updateMany(
        {},
        { $pull: { likes: userId } }
      );

      await OTP.deleteMany({ email: user.email });

      await User.findByIdAndDelete(userId);

      const io = req.app.get("io");

      if (io) {
        io.emit("userDeleted", {
          userId: String(userId),
        });

        const sockets = await io
          .in(`user_${userId}`)
          .fetchSockets();

        sockets.forEach((socket) => {
          socket.disconnect(true);
        });
      }

      return res.json({
        success: true,
        message: "Account deleted permanently.",
      });
    } catch (error) {
      console.error("Delete account error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not delete account.",
      });
    }
  }
);

module.exports = router;