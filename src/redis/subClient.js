const { subClient } = require('./setupRedis');
const { getIO } = require('../socket/index');
const logger = require('../config/logger');
const { handleUserStatus, handleReceivedMessage } = require('../socket/eventHelper');

const io = getIO();
subClient.subscribe('user_status', 'send_message', (err, count) => {
  if (err) {
    logger.error('❌ Error subscribing to user_status channel:', err);
  } else {
    logger.info(`✅ Subscribed to user_status channel. Current subscription count: ${count}`);
  }
});

subClient.on('message', async (channel, receiveData) => {
  switch (channel) {
    case 'user_status': {
      const statusData = JSON.parse(receiveData);
      handleUserStatus(io, statusData);
      break;
    }

    case 'send_message':
      {
        const messageData = JSON.parse(receiveData);
        handleReceivedMessage(io, messageData);
      }
      break;
    default:
      break;
  }
});
