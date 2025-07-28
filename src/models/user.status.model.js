const mongoose = require('mongoose');

const UserStatusSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef UserStatus
 */
const UserStatus = mongoose.model('UserStatus', UserStatusSchema);

module.exports = UserStatus;
