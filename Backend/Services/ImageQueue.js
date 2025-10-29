const { Queue, Worker } = require("bullmq");
const cloudinary = require("cloudinary").v2;
const PropertyModel = require("../Models/PropertyModel");
const pLimit = require("p-limit");
const { connectRedis } = require("../DB/Redis");

const imageUploadQueue = new Queue("imageUploadQueue", {
  connection: connectRedis(),
});
// new QueueScheduler("imageUploadQueue", { connection: connectRedis() });
const worker = new Worker(
  "imageUploadQueue",
  async (job) => {
    // console.log("job", job);
    const { files, propertyId } = job.data;

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });

    const limit = pLimit(3); // limit concurrent uploads to 3

    const uploadedUrls = await Promise.all(
      files.map((file) =>
        limit(
          () =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: "PMS_PROPERTIES" },
                (err, uploaded) => {
                  if (err) return reject(err);
                  resolve(uploaded.secure_url);
                }
              );
              if (file.buffer instanceof Buffer) {
                stream.end(file.buffer);
              } else if (file.buffer.data) {
                stream.end(Buffer.from(file.buffer.data));
              } else {
                reject(new Error("Invalid file buffer"));
              }
            })
        )
      )
    );

    await PropertyModel.findByIdAndUpdate(propertyId, { images: uploadedUrls });
    return uploadedUrls;
  },
  { connection: connectRedis() }
);
// Worker listeners
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(job.data.files);
  console.error(`❌ Job ${job.id} failed`, err.message);
});
module.exports = imageUploadQueue;
