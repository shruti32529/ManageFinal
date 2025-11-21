const redis = require('redis');

const client = redis.createClient({
  url: 'redis://127.0.0.1:6379' // default local Redis
});

client.on('error', (err) => console.log('❌ Redis connection error:', err));
client.connect()
  .then(() => console.log('✅ Redis connected'));

module.exports = client;
