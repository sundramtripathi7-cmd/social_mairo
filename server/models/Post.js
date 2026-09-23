const mongoose = require("mongoose");

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const postSchema = new mongoose.Schema(
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

    /*
      Every feed post auto-deletes after 7 days.
      This is the only retention option.
    */
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
  MongoDB TTL: documents are removed when expiresAt is reached.
*/
postSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

postSchema.statics.getDefaultExpiresAt = function (
  fromDate = new Date()
) {
  return new Date(fromDate.getTime() + SEVEN_DAYS_MS);
};

postSchema.statics.SEVEN_DAYS_MS = SEVEN_DAYS_MS;

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
