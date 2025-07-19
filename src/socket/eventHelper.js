const logger = require('../config/logger');
const Message = require('../models/message.model');
const {
  cacheUser,
  notifyUserStatus,
  removeUserFromCache,
  checkUserPresentInThread,
  cacheThread,
  removeUserFromThread,
  removeuserProfile,
  isUserOnline,
} = require('../redis/redisClient');
const { updateMessageStatus, getUnreadMessageCount } = require('../services/message.service');
const { getParticipants, isThreadExists, createThread, isUserExistInThread } = require('../services/thread.server');
const { getUserById } = require('../services/user.service');

/**
 * @param {*} socket
 * @param {*} data
 * This function handles the logic when a user come online for first time.
 * - It caches the user ID and socket ID in Redis.
 * - It retrieves the threads associated with the user.
 * - It notifies all participants in those threads about the user's online status.
 */
const handleUserJoin = async (socket, data) => {
  try {
    const userId = data?.userId;
    const socketId = socket.id;
    // eslint-disable-next-line no-param-reassign
    socket.data.userId = userId; // Store userId in socket for later use
    await cacheUser(userId, socketId);
    const participants = await getParticipants(userId);
    notifyUserStatus(userId, participants, 'online');
    // make user joining it's own room so that i don't need to emit the any events to all socket id's with user connected just send to room.
    socket.join(`user:${userId}`);
    // update user status in mongoDB
    logger.info(`User ${userId} has joined the application with socket ID: ${socketId}`);
  } catch (error) {
    logger.error('Error handling user join:', error);
  }
};

/**
 * This function handles the logic for a user leaving the application.

 */
const handleUserLeave = async (socket) => {
  try {
    const socketId = socket?.id;
    const userId = socket?.data?.userId;
    const threadId = socket.data.threadIds;
    logger.info(`User ${userId}, ${socketId} has left the application.`);
    const remainingSocketIds = await removeUserFromCache(userId, socketId);
    const participants = await getParticipants(userId);
    if (remainingSocketIds.length === 0) {
      notifyUserStatus(userId, participants, 'offline');
      removeUserFromThread(userId, threadId);
      removeuserProfile(userId);
      // udate user status in mongoDB
    }
  } catch (error) {
    logger.error('Error handling user leave:', error);
  }
};

/**
 * @param {*} socket
 * @param {*} threadId
 * This function allows a socket to join a specific thread.
 * It uses the `join` method of the socket to join a room identified by the thread ID.
 * Before joining the
 */
const joinThread = async (socket, data) => {
  const threadId = data?.threadId;
  const userId = data?.userId;
  if (!threadId || !userId) {
    logger.error('Invalid threadId or userId');
    return;
  }
  // validate threadId and userId before joining
  const isUserInThread = await isUserExistInThread(threadId, userId);
  if (!isUserInThread) {
    logger.error(`User ${userId} is not in thread ${threadId}`);
    return;
  }
  // Join the thread room
  socket.join(`thread:${threadId}`);
  // save the participated user inside the thread
  await cacheThread(threadId, userId);
  logger.info(`Socket ${socket.id} joined thread ${threadId}`);
};

/**
 * @param {*} data
 * This function handles the logic for sending a message.
 * It retrieves the message, current user ID, and other user ID from the data object
 * It checks if a thread exists between the current user and the other user.
 * If no thread exists, it creates a new thread.
 * It creates a new message object with the thread ID, sender ID, message content,
 * type, and status.
 * If in thead more than one user than user exists emit the message to thread.
 * Redis io-adpatoper will handle this we don't need to publish manually.
 */
const handleSendMessage = async (socket, data) => {
  try {
    const { message, currentUserId, otherUserId, type } = data;
    if (!otherUserId || !message || !currentUserId) {
      throw new Error('Invalid data provided');
    }
    let userThread = await isThreadExists(currentUserId, otherUserId);
    if (!userThread) {
      userThread = await createThread(currentUserId, otherUserId);
    }
    const messageData = new Message({
      threadId: userThread.threadId,
      senderId: currentUserId,
      message,
      type: type || 'text',
      status: 'sent',
    });
    await messageData.save();
    // publisher('send_message', messageData);
    // Join the thread if not already joined, user can join muliple threads at same time.
    const isCurrentUserPresentInTread = await checkUserPresentInThread(currentUserId, userThread.threadId);
    if (!isCurrentUserPresentInTread) {
      await joinThread(socket, userThread.threadId);
    }
    // here both user present in thread so send message
    const isOtherUserPresentInTread = await checkUserPresentInThread(otherUserId, userThread.threadId);
    const isOtherUserOnline = await isUserOnline(otherUserId);
    if (isOtherUserPresentInTread) {
      socket.to(`thread:${userThread.threadId}`).emit('chat_message', messageData?._doc);
    } else if (isOtherUserOnline) {
      // send the notification, when user will opn the thread message will start emiting.
      const unreadMessageCount = await getUnreadMessageCount(userThread.threadId);
      const userName = await getUserById(currentUserId);
      await socket.to(`user:${otherUserId}`).emit('notify_message_outside_thread', {
        threadId: userThread.threadId,
        fromUser: {
          senderId: currentUserId,
          name: userName?._doc?.name,
        },
        messagePreview: message,
        type: type || 'text',
        unreadCount: unreadMessageCount,
        date: new Date(),
      });
    }
  } catch (error) {
    logger.error('Error sending message:', error);
  }
};

/**
 * @param : data.
 * @description : When user will get the senderId and messageId inside data so that we can emit to sender that user have seen the message if sender online, update messsage status to deliver.
 */

const handleMessageAckknowledge = async (socket, data) => {
  try {
    const { _id, senderId, messageStatus } = data;
    const isMessageUpdated = updateMessageStatus(data, messageStatus);
    if (isMessageUpdated) {
      // notify the sender if online, emit event to sender all socket ids.
      socket.to(`user:${senderId}`).emit('message_status', {
        messageId: _id,
        messageStatus,
        seenAt: new Date(),
      });
    }
  } catch (error) {
    logger.error('error occured while notifying message acknowledgement status', error);
  }
};

module.exports = {
  handleUserJoin,
  handleSendMessage,
  handleUserLeave,
  joinThread,
  handleMessageAckknowledge,
};
