const express = require("express");
const jwt = require("jsonwebtoken");
const FeedPost = require("../models/FeedPost");

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

/*
  CREATE FEED POST
  Text, photo, or both. No video.
*/
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { text, image } = req.body;

    if (!text?.trim() && !image) {
      return res.status(400).json({
        success: false,
        message: "Post needs text or a photo.",
      });
    }

    if (
      image &&
      typeof image === "string" &&
      !image.startsWith("data:image/")
    ) {
      return res.status(400).json({
        success: false,
        message: "Only photos can be posted.",
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

    const post = await FeedPost.create({
      author: req.userId,
      text: text?.trim() || "",
      image: image || "",
    });

    const populatedPost = await FeedPost.findById(
      post._id
    ).populate("author", "username photo");

    return res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    console.error("Create feed post error:", error);

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
      message: "Could not create post.",
    });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const posts = await FeedPost.find()
      .populate("author", "username photo")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load feed.",
    });
  }
});

router.delete(
  "/:postId",
  authenticateToken,
  async (req, res) => {
    try {
      const post = await FeedPost.findById(
        req.params.postId
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found.",
        });
      }

      if (String(post.author) !== String(req.userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own posts.",
        });
      }

      await FeedPost.findByIdAndDelete(post._id);

      return res.json({
        success: true,
        message: "Post deleted.",
      });
    } catch (error) {
      console.error("Delete feed post error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not delete post.",
      });
    }
  }
);

router.post(
  "/:postId/like",
  authenticateToken,
  async (req, res) => {
    try {
      const post = await FeedPost.findById(
        req.params.postId
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found.",
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
      console.error("Like feed post error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not like post.",
      });
    }
  }
);

module.exports = router;
