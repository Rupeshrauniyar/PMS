const Redis = require("ioredis");
require("dotenv").config();

const client = new Redis(process.env.REDIS_HOST, {
  maxRetriesPerRequest: null,
});

client.on("connect", () =>
  console.log(`Redis connected (PID: ${process.pid})`)
);
client.on("error", (err) => console.error("Redis Client Error:", err));

async function connectRedis() {
  return client;
}

// Duplicate lightweight connection for BullMQa

async function disconnectRedis() {
  if (client.isOpen) await client.quit();
  console.log(`Redis disconnected (PID: ${process.pid})`);
}

module.exports = { client, connectRedis, disconnectRedis };
