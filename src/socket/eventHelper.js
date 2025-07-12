const logger = require('../config/logger');
const Message = require('../models/message.model');
const { publisher } = require('../redis/pubClient');
const {
  cacheUser,
  notifyUserStatus,
  checkOtherUserInsideThread,
  getUserSocketIds,
  removeUserFromCache,
} = require('../redis/redisClient');
const { getParticipants, isThreadExists, createThread } = require('../services/thread.server');

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
    // update user status in mongoDB
    logger.info(`User ${userId} has joined the application with socket ID: ${socketId}`);
  } catch (error) {
    logger.error('Error handling user join:', error);
  }
};

/**
 * This function handles the logic for a user leaving the application.

 */
const handleUserLeave = async (io) => {
  try {
    const socketId = io?.id;
    const userId = io?.data?.userId;
    logger.info(`User ${userId}, ${socketId} has left the application.`);
    const remainingSocketIds = await removeUserFromCache(userId, socketId);
    const participants = await getParticipants(userId);
    if (remainingSocketIds.length === 0) {
      notifyUserStatus(userId, participants, 'offline');
      // udate user status in mongoDB
    }
  } catch (error) {
    logger.error('Error handling user leave:', error);
  }
};

/**
 *
 * @param {*} io
 * @param {*} data
 * This function handles the logic for sending a message.
 * - It retrieves the message, current user ID, and other user ID from the data object
 * - It checks if a thread exists between the current user and the other user.
 * - If no thread exists, it creates a new thread.
 * - It creates a new message object with the thread ID, sender ID, message content,
 *   type, and status.
 * - Finally, it saves the message to the database and publishes it to the 'send_message'
 *   channel for further processing.
 */
const handleSendMessage = async (data) => {
  try {
    const { message, currentUserId, otherUserId } = data;
    if (!otherUserId || !message || !currentUserId) {
      throw new Error('Invalid data provided');
    }
    const userThread = await isThreadExists(currentUserId, otherUserId);
    if (!userThread) {
      await createThread(currentUserId, otherUserId);
    }
    const messageData = new Message({
      threadId: userThread.id,
      senderId: currentUserId,
      message,
      type: 'text',
      status: 'sent',
    });
    await messageData.save();
    publisher('send_message', messageData);
  } catch (error) {
    logger.error('Error sending message:', error);
  }
};

/**
 *
 * @param {*} io
 * @param {*} data
 * This function handles the logic for receiving a message.
 * - It retrieves the message, current user ID, and other user ID from the data object
 * - It checks if the thread ID, other user ID, message, and current user ID
 *   are valid.
 * - It retrieves the socket IDs of the other user from Redis.
 * - It checks if the other user is inside the thread.
 * - If the other user is already in the thread, it updates the message status to '
 */
const handleReceivedMessage = async (io, data) => {
  try {
    const { message, currentUserId, otherUserId } = data;
    const { threadId } = message; // Assuming threadId is part of the messageData
    if (!threadId || !otherUserId || !message || !currentUserId) {
      throw new Error('Invalid data provided');
    }
    const otherUserSocketId = await getUserSocketIds(otherUserId);
    const isOtherUserInsideThread = await checkOtherUserInsideThread(otherUserId, threadId);
    // case1: if the other user is already in the thread
    if (otherUserSocketId.length > 0 && isOtherUserInsideThread) {
      message.status = 'delivered'; // Update status to delivered
      io.to(`thread:${threadId}`).emit('receive_message', {
        threadId,
        message,
        senderId: currentUserId,
        recipientId: otherUserId,
      });
    } else if (otherUserSocketId.length > 0) {
      // case2 : if the other user is online but not in the thread
      message.status = 'delivered'; // Update status to delivered
      otherUserSocketId.forEach((socketId) => {
        io.to(socketId).emit('receive_message', {
          threadId,
          message,
          senderId: currentUserId,
          recipientId: otherUserId,
        });
      });
    }
  } catch (error) {
    logger.error('❌ Error handling received message:', error);
  }
};

/**
 *
 * @param {*} io
 * @param {*} statusData
 * This function handles the user status updates.
 * It retrieves the user ID, otherUsers and status from the statusData object,
 * then gets the socket IDs associated with that user from Redis.
 * Finally, it emits the 'user_status' event to all sockets associated with that user,
 * sending the user ID and status as data.
 */
const handleUserStatus = (io, statusData) => {
  const { userId, otherUserIds, status } = statusData;
  let otherUserSocketIds = [];
  otherUserIds.forEach((otherUserId) => {
    otherUserSocketIds = otherUserSocketIds.concat(getUserSocketIds(otherUserId));
  });
  otherUserSocketIds.forEach((socketId) => {
    io.to(socketId).emit('user_status', { userId, status });
  });
};

module.exports = { handleUserJoin, handleSendMessage, handleReceivedMessage, handleUserStatus, handleUserLeave };
