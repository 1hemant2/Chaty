const logger = require('../config/logger');
const { pubClient } = require('./setupRedis');

const publisher = (channel, data) => {
  pubClient.publish(channel, JSON.stringify(data), (err, res) => {
    if (err) {
      logger.error('❌ Error publishing message:', err);
    } else {
      logger.info(`✅ Message published to ${channel}:`, res);
    }
  });
};

module.exports = {
  publisher,
};
