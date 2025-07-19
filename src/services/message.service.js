const logger = require('../config/logger');
const Message = require('../models/message.model');

const updateMessageStatus = async (messageId, status) => {
  try {
    return await Message.findByIdAndUpdate(messageId, { $set: { status } }, { $new: true });
  } catch (error) {
    logger.error('error occured while updating message status', error);
  }
};

const getUnreadMessageCount = async (threadId) => {
  try {
    return await Message.countDocuments({ threadId, status: { $ne: 'read' } });
  } catch (error) {
    logger.error('error while getting unread message', error);
  }
};

module.exports = {
  updateMessageStatus,
  getUnreadMessageCount,
};
