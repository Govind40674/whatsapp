const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    receiver: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true, // ✅ should be required
    },

    // 🔥 roomId for fast querying
    roomId: {
      type: String,
      // required: true,
    },

    // 🔥 message status (future use)
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Message", messageSchema);