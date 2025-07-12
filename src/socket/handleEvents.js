const logger = require('../config/logger');
const { handleUserJoin, handleSendMessage } = require('./eventHelper');

const handleEvents = ({ socket }) => {
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // This event is triggered when a user joins the application.
  socket.on('user_join', async (data) => {
    await handleUserJoin(socket, data);
  });

  // This event is triggered when a user sends a message.
  socket.on('send_message', async (data) => {
    await handleSendMessage(data);
  });
};

module.exports = { handleEvents };
