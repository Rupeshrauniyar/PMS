const PropertyModel = require("../Models/PropertyModel");
const UserModel = require("../Models/UserModel");
require("dotenv").config();
const { client } = require("../DB/Redis");
const {
  pushUserNotification,
  NOTIFICATION_KINDS,
} = require("../utils/notificationsHelper");
const cloudinary = require("cloudinary").v2;
const pLimit = require("p-limit");
const { isValidObjectId, sendServerError } = require("../utils/authHelpers");

const uploadLimit = pLimit(3);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.addProperty = async (req, res) => {
  try {
    const {
      title,
      sellingType,
      propertyType,
      location,
      price,
      area,
      washrooms,
      rooms,
      description,
    } = req.body;

    const userId = req.userId;
    const accountType = req.accountType;

    if (
      !title ||
      !sellingType ||
      !propertyType ||
      !location ||
      !price ||
      !rooms ||
      !washrooms ||
      !description
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!req.files?.length) {
      return res.status(400).json({ message: "At least one image is required." });
    }

    const imageUrls = await Promise.all(
      req.files.map((file) =>
        uploadLimit(
          () =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: "Propatyc_PROPERTIES" },
                (err, uploaded) => {
                  if (err) return reject(err);
                  resolve(uploaded.secure_url);
                },
              );
              stream.end(file.buffer);
            }),
        ),
      ),
    );

    const property = await PropertyModel.create({
      title,
      sellingType,
      propertyType,
      location,
      price,
      area,
      washrooms,
      rooms,
      description,
      owner: userId,
      ownerModel: accountType === "google" ? "googleUsers" : "users",
      images: imageUrls,
    });

    const propertySafe = {
      _id: property._id,
      title: property.title,
      sellingType: property.sellingType,
      propertyType: property.propertyType,
      location: property.location,
      price: property.price,
      area: property.area,
      washrooms: property.washrooms,
      rooms: property.rooms,
      description: property.description,
      images: property.images,
      createdAt: property.createdAt,
    };

    try {
      await client.sendCommand([
        "JSON.ARRINSERT",
        `property:${property.propertyType}`,
        ".",
        "0",
        JSON.stringify(propertySafe),
      ]);
    } catch (redisErr) {
      console.error("Redis JSON.ARRINSERT failed:", redisErr.message);
    }

    await UserModel.updateOne(
      { _id: userId },
      { $push: { myProperties: { propId: property._id } } },
    );

    const publisher = await UserModel.findById(userId).select("FCMtokens").lean();
    await pushUserNotification(
      userId,
      {
        title: "Listing published",
        body: `Your listing "${title}" is now live.`,
        kind: NOTIFICATION_KINDS.LISTING_LIVE,
        propId: property._id,
      },
      publisher?.FCMtokens ?? [],
    );

    return res.status(200).json({ success: true, property: property._id });
  } catch (err) {
    return sendServerError(res, err, "addProperty");
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const Data = req.body;
    const userId = req.userId;

    if (!Data?._id) {
      return res.status(400).json({
        success: false,
        message: "Property id is required.",
      });
    }
    if (!isValidObjectId(Data._id)) {
      return res.status(400).json({ success: false, message: "Invalid property id." });
    }

    const property = await PropertyModel.findOne({
      _id: Data._id,
      owner: userId,
    }).select("propertyType");

    if (!property) {
      return res.status(403).json({
        success: false,
        message: "Not authorized or property not found.",
      });
    }

    await PropertyModel.deleteOne({ _id: Data._id });

    await UserModel.updateOne(
      { _id: userId },
      { $pull: { myProperties: { propId: Data._id } } },
    );

    const cacheKey = `property:${property.propertyType}`;
    try {
      const arr = await client.sendCommand(["JSON.GET", cacheKey, "."]);
      if (arr && String(arr).length > 0) {
        const array = JSON.parse(arr);
        if (Array.isArray(array)) {
          const newArray = array.filter(
            (item) => String(item._id) !== String(Data._id),
          );
          await client.sendCommand([
            "JSON.SET",
            cacheKey,
            ".",
            JSON.stringify(newArray),
          ]);
        }
      }
    } catch (redisErr) {
      console.error("Redis cache update failed:", redisErr.message);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "deleteProperty");
  }
};

exports.editProperty = async (req, res) => {};
