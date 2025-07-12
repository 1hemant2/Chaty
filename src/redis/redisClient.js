const config = require('../config/config');
const logger = require('../config/logger');
const { publisher } = require('./pubClient');
const { redisClient } = require('./setupRedis');

const cacheUser = async (userId, socketId) => {
  try {
    await redisClient.select(config.redis.DB_NUMBER.user);
    await redisClient.sadd(`user:${userId}`, socketId);
  } catch (error) {
    logger.error('❌ Error setting users in Redis:', error);
  }
};

/**
 *
 * @param {*} otherUserId
 * @param {*} threadId
 * @returns if the other user is inside the thread
 * This function checks if the other user is part of the thread by checking the participants in Redis
 * It retrieves the participants of the thread from Redis and checks if the other user ID is included
 * in the list of participants.
 * If the other user is found in the thread participants, it returns true; otherwise, it returns false.
 */
const checkUserPresentInThread = async (otherUserId, threadId) => {
  try {
    const threadParticipants = await redisClient.smembers(`thread:${threadId}`);
    return threadParticipants.includes(otherUserId);
  } catch (error) {
    logger.error('❌ Error checking other user inside thread:', error);
    return false;
  }
};

/**
 * Notify the status of a user to all participants in a thread.
 * @param {*} userId - The ID of the user whose status is being notified.
 * @param {*} participants - The list of participant IDs to notify.
 * This function publishes a message to the 'user_status' channel
 * to notify all participants about the user's online status.
 */
const notifyUserStatus = (userId, participants, status) => {
  participants.forEach(async (participant) => {
    publisher('user_status', {
      userId,
      status,
      otherUserId: participant,
    });
  });
};

/**
 * This function return socket IDs of the user from Redis, if user is present in Redis.
 * If the user is not present, it returns an empty array.
 * @param {*} userId
 * @returns {Promise<string[]>} - An array of socket IDs for the user.
 * If the user is not present, it returns an empty array.
 * @throws {Error} - If there is an error while fetching the socket IDs from Redis
 * or if the userId is not provided.
 */
const getUserSocketIds = (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is not provided');
    }
    return redisClient.smembers(`user:${userId}`);
  } catch (error) {
    logger.error('❌ Error fetching user socket IDs:', error);
    return [];
  }
};

/**
 *
 * @param {*} userId
 * @param {*} socketId
 * This function removes the user from the Redis cache.
 * It selects the user database and removes the socket ID from the user's set.
 * If after removing socket id, the user has no more socket IDs, set the user status as offline and remove the user from the cache.
 */
const removeUserFromCache = async (userId, socket) => {
  try {
    const socketId = socket.id;
    await redisClient.select(config.redis.DB_NUMBER.user);
    await redisClient.srem(`user:${userId}`, socketId);
    const remainingSocketIds = await redisClient.smembers(`user:${userId}`);
    if (remainingSocketIds.length === 0) {
      await redisClient.del(`user:${userId}`);
    }
    logger.info(`User ${userId} with socket ID ${socketId} has been removed from cache.`);
    return remainingSocketIds;
  } catch (error) {
    logger.error('❌ Error removing user from cache:', error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

/**
 *
 * @param {*} threadId
 * @param {*} userId
 * When user join the thread save it into redis.
 */
const cacheThread = async (threadId, userId) => {
  try {
    await redisClient.select(config.redis.DB_NUMBER.user);
    await redisClient.sadd(`thread:${threadId}`, userId);
  } catch (error) {
    logger.error('❌ Error setting users in Redis:', error);
  }
};

/**
 * @param {*} threadId
 * @param {*} userId
 * when user goes offline remove user from thread
 * If thread become empty deleted from redis.
 */
const removeUserFromThread = async (userId, threadId) => {
  try {
    await redisClient.select(config.redis.DB_NUMBER.user);
    await redisClient.srem(`thread:${threadId}`, userId);
    const threadUsers = await redisClient.smembers(`thread:${threadId}`);
    // if no user present in thread remove from redis.
    if (threadUsers.length === 0) {
      await redisClient.del(`user:${userId}`);
    }
  } catch (error) {
    logger.error('❌ Error setting users in Redis:', error);
  }
};

module.exports = {
  cacheUser,
  notifyUserStatus,
  checkUserPresentInThread,
  getUserSocketIds,
  removeUserFromCache,
  cacheThread,
  removeUserFromThread,
};
