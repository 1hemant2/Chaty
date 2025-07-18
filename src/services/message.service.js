const logger = require('../config/logger');
const Message = require('../models/message.model');

const updateMessageStatus = async (messageId, status) => {
  try {
    return await Message.findByIdAndUpdate(messageId, { $set: { status } }, { $new: true });
  } catch (error) {
    logger.error('error occured while updating message status', error);
  }
};

module.exports = {
  updateMessageStatus,
};
