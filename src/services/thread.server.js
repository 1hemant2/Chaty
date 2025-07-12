const Thread = require('../models/thread.model');

// This function should return the participants of the thread
const getParticipants = async (userId) => {
  const userThreads = await Thread.find({ participants: userId });
  const participants = userThreads.map((thread) => {
    return thread.participants.filter((participant) => participant.toString() !== userId);
  });
  return participants || [];
};

const isThreadExists = async (otherUserId, currentUserId) => {
  return Thread.findOne({
    participants: { $all: [otherUserId, currentUserId] },
  });
};

const createThread = async (currentUserId, otherUserId) => {
  // Sort user IDs to ensure uniqueness regardless of order
  const sortedIds = [currentUserId, otherUserId].sort();
  const threadId = `thread:${sortedIds[0]}_${sortedIds[1]}`;
  const newThread = new Thread({
    participants: sortedIds,
    threadId,
  });
  await newThread.save();
  return newThread;
};

module.exports = { getParticipants, isThreadExists, createThread };
