const logger = require('../config/logger');
const { handleUserJoin, handleSendMessage, handleUserLeave, joinThread } = require('./eventHelper');

const handleEvents = ({ socket }) => {
  // Handle disconnection
  socket.on('disconnect', async () => {
    await handleUserLeave(socket);
  });

  // This event is triggered when a user joins the application.
  socket.on('user_join', async (data) => {
    await handleUserJoin(socket, data);
  });

  // This event is triggered when a user sends a message.
  socket.on('chat_message', async (data) => {
    await handleSendMessage(socket, data);
  });

  // This event join a thread
  socket.on('join_thread', async (data) => {
    await joinThread(socket, data);
  });

  // remove from thread
  socket.on('remove_thread', async (data) => {
    logger.info('remove thread', data);
  });
};

module.exports = { handleEvents };
