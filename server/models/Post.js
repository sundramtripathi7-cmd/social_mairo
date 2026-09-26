const mongoose = require("mongoose");

const STATUS_TTL_MS = 24 * 60 * 60 * 1000;

const STATUS_BACKGROUNDS = [
  "#075e54",
  "#0b6e4f",
  "#123524",
  "#1b4332",
  "#1a365d",
  "#1e3a5f",
  "#312e81",
  "#4a1942",
  "#7f1d1d",
  "#7c2d12",
  "#3f3f46",
  "#111b21",
];

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

    /*
      Solid background for text statuses.
      Photo statuses leave this empty.
    */
    background: {
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
      People who opened this status.
      The author is never added.
    */
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /*
      Status updates auto-delete after 24 hours.
    */
    expiresAt: {
      type: Date,
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

postSchema.statics.STATUS_TTL_MS = STATUS_TTL_MS;

postSchema.statics.STATUS_BACKGROUNDS =
  STATUS_BACKGROUNDS;

postSchema.statics.getDefaultExpiresAt = function (
  fromDate = new Date()
) {
  return new Date(fromDate.getTime() + STATUS_TTL_MS);
};

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
