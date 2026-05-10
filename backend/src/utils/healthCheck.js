const mongoose = require('mongoose');

/**
 * Check the health of the backend service
 * @returns {Promise<Object>} Health status object
 */
async function checkHealth() {
  const startTime = Date.now();
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'checking...'
    },
    server: {
      status: 'ok',
      nodeVersion: process.version,
      memory: process.memoryUsage()
    }
  };

  try {
    // Check database connection
    const mongooseState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    health.database.status = stateMap[mongooseState] || 'unknown';
    health.database.connection = mongooseState === 1;

    // Try to verify database with a simple ping
    if (mongooseState === 1) {
      try {
        await mongoose.connection.collection('system.indexes').findOne({});
        health.database.responsive = true;
      } catch (err) {
        health.database.responsive = false;
        health.database.error = err.message;
      }
    }

    health.responseTime = `${Date.now() - startTime}ms`;
    return health;
  } catch (error) {
    health.status = 'error';
    health.error = error.message;
    health.database.status = 'error';
    health.database.responsive = false;
    return health;
  }
}

module.exports = { checkHealth };
