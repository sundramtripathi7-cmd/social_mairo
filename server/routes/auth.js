const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

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

function cleanUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
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

    if (finalUsername.length < 3 || finalUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 3 and 30 characters.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      username: finalUsername,
      email: cleanEmail,
      password: hashedPassword,
      photo: "",
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
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        photo: user.photo || "",
      },
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
          message: "An account with this email already exists.",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
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
      user: {
        id: user._id,
        name: user.name,
        username: user.username || "",
        email: user.email,
        photo: user.photo || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

// =====================================================
// CURRENT USER
// =====================================================

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username || "",
        email: user.email,
        photo: user.photo || "",
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load profile.",
    });
  }
});

// =====================================================
// UPDATE PROFILE
// =====================================================

router.patch("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, username, photo } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name cannot exceed 50 characters.",
        });
      }
    }

    let finalUsername;

    if (username !== undefined) {
      finalUsername = cleanUsername(username);

      if (!finalUsername) {
        return res.status(400).json({
          success: false,
          message: "Username cannot be empty.",
        });
      }

      if (!/^[a-zA-Z0-9_.]+$/.test(finalUsername)) {
        return res.status(400).json({
          success: false,
          message:
            "Username can contain only letters, numbers, underscore and dot.",
        });
      }

      if (finalUsername.length < 3 || finalUsername.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 30 characters.",
        });
      }

      const usernameTaken = await User.findOne({
        username: finalUsername,
        _id: { $ne: req.userId },
      });

      if (usernameTaken) {
        return res.status(409).json({
          success: false,
          message: "This username is already taken.",
        });
      }
    }

    if (photo !== undefined && typeof photo !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid profile photo.",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (username !== undefined) {
      updateData.username = finalUsername;
    }

    if (photo !== undefined) {
      updateData.photo = photo;
    }

    const updatedUser = await User.findByIdAndUpdate(
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
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username || "",
        email: updatedUser.email,
        photo: updatedUser.photo || "",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not update profile.",
    });
  }
});

// =====================================================
// GET ALL USERS
// =====================================================

router.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find(
      {
        _id: { $ne: req.userId },
      },
      {
        password: 0,
      }
    ).sort({
      name: 1,
    });

    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      username: user.username || "",
      email: user.email,
      photo: user.photo || "",
      initial: user.name.charAt(0).toUpperCase(),
      online: false,
      lastMessage: "Start a conversation",
      time: "",
    }));

    return res.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load users.",
    });
  }
});

module.exports = router;
