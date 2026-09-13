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
  CREATE POST
  POST /api/posts
*/
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { text, image } = req.body;

    if (!text?.trim() && !image) {
      return res.status(400).json({
        success: false,
        message: "Post cannot be empty.",
      });
    }

    const post = await Post.create({
      author: req.userId,
      text: text?.trim() || "",
      image: image || "",
    });

    const populatedPost = await Post.findById(
      post._id
    ).populate(
      "author",
      "username photo"
    );

    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post: populatedPost,
    });
  } catch (error) {
    console.error("Create post error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create post.",
    });
  }
});

/*
  GET ALL POSTS
  GET /api/posts
*/
router.get("/", authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate(
        "author",
        "username photo"
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load posts.",
    });
  }
});

/*
  DELETE OWN POST
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
          message: "Post not found.",
        });
      }

      if (
        String(post.author) !==
        String(req.userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete your own posts.",
        });
      }

      await Post.findByIdAndDelete(
        req.params.postId
      );

      return res.json({
        success: true,
        message: "Post deleted successfully.",
      });
    } catch (error) {
      console.error("Delete post error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not delete post.",
      });
    }
  }
);

/*
  LIKE / UNLIKE POST
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
      });
    } catch (error) {
      console.error("Like post error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not like post.",
      });
    }
  }
);

module.exports = router;