const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 20000, // 👈 VERY IMPORTANT
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
  }
})();

module.exports = redisClient;
