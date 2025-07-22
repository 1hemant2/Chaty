const { Types } = require('mongoose');
const logger = require('../config/logger');
const Thread = require('../models/thread.model');

// This function should return the participants of the thread
const getParticipants = async (userId) => {
  const userThreads = await Thread.find({ participants: Types.ObjectId(userId) });
  userThreads.map((thread) => {
    return thread.participants.filter((participant) => participant.toString() !== userId);
  });
};

const isThreadExists = async (otherUserId, currentUserId) => {
  return Thread.findOne({
    participants: { $all: [otherUserId, currentUserId] },
  });
};

const createThread = async (currentUserId, otherUserId) => {
  // Sort user IDs to ensure uniqueness regardless of order
  try {
    const sortedIds = [currentUserId, otherUserId].sort();
    const threadId = `thread:${sortedIds[0]}_${sortedIds[1]}`;
    const newThread = new Thread({
      participants: sortedIds,
      threadId,
    });
    await newThread.save();
    return newThread;
  } catch (error) {
    logger.error('errro while creating thread 👻', error);
  }
};

const isUserExistInThread = async (threadId, userId) => {
  try {
    return await Thread.exists({
      threadId,
      participants: { $in: [Types.ObjectId(userId)] },
    });
  } catch (error) {
    logger.error('error while validating user present in thread => ', error);
  }
};

/**
 *
 * @param {*} userId
 * @description: This function will return the user thread based on userId.
 */
const getUserAllThreads = async (userId) => {
  try {
    return await Thread.find({
      participants: userId,
    }).lean();
  } catch (error) {
    logger.error('error occured in getUserAllThreads function => ', error);
  }
};
module.exports = { getParticipants, isThreadExists, createThread, isUserExistInThread, getUserAllThreads };
