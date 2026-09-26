const mongoose = require("mongoose");

const groupReadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    lastReadAt: {
      type: Date,
      default: () => new Date(0),
    },
  },
  {
    timestamps: true,
  }
);

const GroupRead = mongoose.model(
  "GroupRead",
  groupReadSchema
);

module.exports = GroupRead;
