const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const threadSchema = mongoose.Schema(
  {
    threadId: {
      type: String,
      required: true,
      trim: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
threadSchema.plugin(toJSON);
threadSchema.plugin(paginate);

/**
 * @typedef Thread
 */
const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
