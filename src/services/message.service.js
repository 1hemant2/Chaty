const logger = require('../config/logger');
const Message = require('../models/message.model');

/**
 *
 * @param {*} messageId
 * @param {*} status
 * @description: This function update the message status and return the updated document.
 */
const updateMessageStatus = async (messageId, status) => {
  try {
    return await Message.findByIdAndUpdate(messageId, { $set: { status } }, { $new: true });
  } catch (error) {
    logger.error('error occured while updating message status', error);
  }
};

/**
 *
 * @param {*} threadId
 * @returns: This function return the count of unread messages.
 */
const getUnreadMessageCount = async (threadId) => {
  try {
    return await Message.countDocuments({ threadId, status: { $ne: 'read' } });
  } catch (error) {
    logger.error('error while getting unread message', error);
  }
};

/**
 *
 * @param {*} threadId
 * @description: Get the last message of thread and total unread count
 * @returns : {unreadCount, msg : lastMsgObj}
 */
const getLastMessageAndUnreadCount = async (threadId) => {
  try {
    const result = await Message.aggregate([
      { $match: { threadId, status: { $ne: 'read' } } },
      {
        $facet: {
          unreadCount: [{ $count: 'count' }],
          lastMsg: [
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: 'users', // The name of the User collection
                localField: 'senderId',
                foreignField: '_id',
                as: 'user',
              },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          ],
        },
      },
      {
        $project: {
          unreadCount: { $arrayElemAt: ['$unreadCount.count', 0] },
          msg: { $arrayElemAt: ['$lastMsg', 0] },
        },
      },
    ]);

    return result[0] || { unreadCount: 0, msg: null };
  } catch (error) {
    logger.error('error while fetching lastMessageAndUnreadCount => ', error);
    return { unreadCount: 0, msg: null };
  }
};

module.exports = {
  updateMessageStatus,
  getUnreadMessageCount,
  getLastMessageAndUnreadCount,
};
