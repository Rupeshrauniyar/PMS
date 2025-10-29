const { createClient } = require("redis");
require("dotenv").config();

const client = createClient({
  username: process.env.RED_USER,
  password: process.env.RED_PASS,
  socket: { host: process.env.RED_HOST, port: 13389 },
  maxRetriesPerRequest: null, // required for BullMQ
});

client.on("connect", () =>
  console.log(`Redis connected (PID: ${process.pid})`)
);
client.on("error", (err) => console.error("Redis Client Error:", err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    // await client.flushAll()
  }
  return client;
}

// Duplicate lightweight connection for BullMQa
async function duplicateClient() {
  const dup = client.duplicate();
  await dup.connect();
  return dup;
}

async function disconnectRedis() {
  if (client.isOpen) await client.quit();
  console.log(`Redis disconnected (PID: ${process.pid})`);
}

module.exports = { client, connectRedis, disconnectRedis, duplicateClient };
