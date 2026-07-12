const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    deliveredTo: {
      type: [String],
      default: [],
    },
    readBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

messageSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Message', messageSchema);
