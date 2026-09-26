const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function requiredReceiver() {
        return !this.group;
      },
    },

    group: {
      type: String,
      default: null,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ group: 1, createdAt: 1 });

const Message = mongoose.model(
  "Message",
  messageSchema
);

module.exports = Message;
