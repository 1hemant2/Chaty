const { Server } = require('socket.io');
const { setupRedisAdapter } = require('../redis/setupRedis');
const { handleEvents } = require('./handleEvents');
const logger = require('../config/logger');

let io;

const initSocket = (server) => {
  logger.info('Initializing Socket.IO...🫡');
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  setupRedisAdapter(io);

  // Handle new socket connections
  io.on('connection', (socket) => {
    handleEvents({ socket, io });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
