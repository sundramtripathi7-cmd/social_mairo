const mongoose = require("mongoose");

const feedPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

feedPostSchema.index({ createdAt: -1 });

const FeedPost = mongoose.model(
  "FeedPost",
  feedPostSchema
);

module.exports = FeedPost;
