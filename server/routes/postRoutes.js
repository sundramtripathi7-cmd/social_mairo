const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");

const router = express.Router();

/*
  AUTHENTICATION MIDDLEWARE
*/
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

/*
  Remove statuses older than 24 hours
  (backup while MongoDB TTL catches up).
*/
async function removeExpiredPosts() {
  const oldestAllowed = new Date(
    Date.now() - Post.STATUS_TTL_MS
  );

  await Post.deleteMany({
    $or: [
      { expiresAt: { $lte: new Date() } },
      { createdAt: { $lte: oldestAllowed } },
    ],
  });
}

function isOwnStatus(post, userId) {
  const authorId =
    post.author?._id || post.author;

  return String(authorId) === String(userId);
}

function shapeStatus(post, userId) {
  const plain =
    typeof post.toObject === "function"
      ? post.toObject()
      : post;

  const viewers = Array.isArray(plain.viewers)
    ? plain.viewers
    : [];

  const viewedByMe = viewers.some((viewer) => {
    const viewerId = viewer?._id || viewer;

    return String(viewerId) === String(userId);
  });

  const shaped = {
    _id: plain._id,
    text: plain.text || "",
    image: plain.image || "",
    background: plain.background || "",
    likes: plain.likes || [],
    createdAt: plain.createdAt,
    expiresAt: plain.expiresAt,
    author: plain.author,
    viewedByMe,
  };

  if (isOwnStatus(plain, userId)) {
    shaped.viewers = viewers.map((viewer) => {
      if (!viewer || typeof viewer !== "object") {
        return { _id: viewer };
      }

      return {
        _id: viewer._id,
        username: viewer.username || "",
        photo: viewer.photo || "",
      };
    });

    shaped.viewersCount = shaped.viewers.length;
  }

  return shaped;
}

/*
  CREATE STATUS
  POST /api/posts
  Statuses always expire after 24 hours.
*/
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { text, image, background } = req.body;

    if (!text?.trim() && !image) {
      return res.status(400).json({
        success: false,
        message: "Status cannot be empty.",
      });
    }

    if (
      image &&
      typeof image === "string" &&
      !image.startsWith("data:image/")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format.",
      });
    }

    if (
      image &&
      typeof image === "string" &&
      image.length > 8 * 1024 * 1024
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Photo is too large. Try a smaller image.",
      });
    }

    let safeBackground = "";

    if (!image) {
      safeBackground = Post.STATUS_BACKGROUNDS.includes(
        background
      )
        ? background
        : Post.STATUS_BACKGROUNDS[0];
    }

    const now = new Date();

    const post = await Post.create({
      author: req.userId,
      text: text?.trim() || "",
      image: image || "",
      background: safeBackground,
      expiresAt: Post.getDefaultExpiresAt(now),
    });

    const populatedPost = await Post.findById(
      post._id
    ).populate("author", "username photo");

    return res.status(201).json({
      success: true,
      message:
        "Status posted. It disappears after 24 hours.",
      post: shapeStatus(populatedPost, req.userId),
    });
  } catch (error) {
    console.error("Create status error:", error);

    if (
      error?.name === "PayloadTooLargeError" ||
      error?.type === "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Photo is too large. Try a smaller image.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not post status.",
    });
  }
});

/*
  GET ACTIVE STATUSES
  GET /api/posts
*/
router.get("/", authenticateToken, async (req, res) => {
  try {
    await removeExpiredPosts();

    const oldestAllowed = new Date(
      Date.now() - Post.STATUS_TTL_MS
    );

    const posts = await Post.find({
      expiresAt: { $gt: new Date() },
      createdAt: { $gt: oldestAllowed },
    })
      .populate("author", "username photo")
      .populate("viewers", "username photo")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      posts: posts.map((post) =>
        shapeStatus(post, req.userId)
      ),
      autoDeleteHours: 24,
    });
  } catch (error) {
    console.error("Get statuses error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load statuses.",
    });
  }
});

/*
  MARK STATUS VIEWED
  POST /api/posts/:postId/view
*/
router.post(
  "/:postId/view",
  authenticateToken,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.postId
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Status not found.",
        });
      }

      if (
        post.expiresAt &&
        post.expiresAt <= new Date()
      ) {
        await Post.findByIdAndDelete(post._id);

        return res.status(404).json({
          success: false,
          message: "Status has expired.",
        });
      }

      if (
        String(post.author) === String(req.userId)
      ) {
        return res.json({
          success: true,
          viewed: false,
        });
      }

      await Post.updateOne(
        { _id: post._id },
        { $addToSet: { viewers: req.userId } }
      );

      return res.json({
        success: true,
        viewed: true,
      });
    } catch (error) {
      console.error("View status error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not update status view.",
      });
    }
  }
);

/*
  DELETE OWN STATUS
  DELETE /api/posts/:postId
*/
router.delete(
  "/:postId",
  authenticateToken,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.postId
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Status not found.",
        });
      }

      if (
        String(post.author) !==
        String(req.userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete your own status.",
        });
      }

      await Post.findByIdAndDelete(
        req.params.postId
      );

      return res.json({
        success: true,
        message: "Status deleted.",
      });
    } catch (error) {
      console.error("Delete status error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not delete status.",
      });
    }
  }
);

/*
  LIKE / UNLIKE STATUS
  POST /api/posts/:postId/like
*/
router.post(
  "/:postId/like",
  authenticateToken,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.postId
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Status not found.",
        });
      }

      if (
        post.expiresAt &&
        post.expiresAt <= new Date()
      ) {
        await Post.findByIdAndDelete(post._id);

        return res.status(404).json({
          success: false,
          message: "Status has expired and was deleted.",
        });
      }

      const userId = String(req.userId);

      const alreadyLiked = post.likes.some(
        (id) => String(id) === userId
      );

      if (alreadyLiked) {
        post.likes = post.likes.filter(
          (id) => String(id) !== userId
        );
      } else {
        post.likes.push(req.userId);
      }

      await post.save();

      return res.json({
        success: true,
        liked: !alreadyLiked,
        likesCount: post.likes.length,
        likes: post.likes,
      });
    } catch (error) {
      console.error("Like status error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not like status.",
      });
    }
  }
);

module.exports = router;
