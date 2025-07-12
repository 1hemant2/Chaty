const { handleUserJoin, handleSendMessage, handleUserLeave } = require('./eventHelper');

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
  socket.on('send_message', async (data) => {
    await handleSendMessage(data);
  });
};

module.exports = { handleEvents };
