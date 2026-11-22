const PropertyModel = require("../Models/PropertyModel");
const UserModel = require("../Models/UserModel");
const BookingModel = require("../Models/BookingModel");
const { OPEN_VISIT_STATUSES } = require("../Models/BookingModel");
require("dotenv").config();
const {
  pushUserNotification,
  pushBrokerNotification,
  NOTIFICATION_KINDS,
} = require("../utils/notificationsHelper");
const cloudinary = require("cloudinary").v2;
const { isValidObjectId, sendServerError } = require("../utils/authHelpers");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const IMAGE_FOLDER = "Propatyc_PROPERTIES";
const VIDEO_FOLDER = "Propatyc_PROPERTY_VIDEOS";
const MAX_IMAGES = 15;
const SELLING_TYPES = ["Rent System", "Selling System"];
const PROPERTY_TYPES = ["House", "Room", "Plot"];

/** Run async tasks with a small concurrency cap (avoids hammering Cloudinary). */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, uploaded) => {
      if (err) return reject(err);
      resolve(uploaded);
    });
    stream.end(buffer);
  });
}

async function uploadImages(files = []) {
  const uploaded = await mapLimit(files, 3, (file) =>
    uploadBuffer(file.buffer, { folder: IMAGE_FOLDER, resource_type: "image" }),
  );
  return uploaded.map((u) => u.secure_url);
}

async function uploadVideo(file) {
  if (!file) return null;
  const u = await uploadBuffer(file.buffer, {
    folder: VIDEO_FOLDER,
    resource_type: "video",
  });
  const thumbnail = cloudinary.url(u.public_id, {
    resource_type: "video",
    format: "jpg",
    secure: true,
    transformation: [{ start_offset: "1", width: 1280, crop: "limit" }],
  });
  return {
    url: u.secure_url,
    publicId: u.public_id,
    thumbnail,
    duration: typeof u.duration === "number" ? Math.round(u.duration) : null,
  };
}

/** Derive a Cloudinary public_id from a delivery URL (best effort). */
function publicIdFromUrl(url) {
  try {
    const m = String(url).match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)\.[a-z0-9]+$/i);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

async function destroyAssets({ imageUrls = [], videoPublicId = null }) {
  const jobs = imageUrls
    .map(publicIdFromUrl)
    .filter(Boolean)
    .map((id) => cloudinary.uploader.destroy(id, { resource_type: "image" }));
  if (videoPublicId) {
    jobs.push(cloudinary.uploader.destroy(videoPublicId, { resource_type: "video" }));
  }
  const results = await Promise.allSettled(jobs);
  results
    .filter((r) => r.status === "rejected")
    .forEach((r) => console.warn("Cloudinary destroy failed:", r.reason?.message || r.reason));
}

function parseAmenities(raw) {
  if (!raw) return [];
  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      list = raw.split(",");
    }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((a) => String(a).trim()).filter(Boolean))].slice(0, 30);
}

function validateCoreFields(body, { partial = false } = {}) {
  const required = ["title", "sellingType", "propertyType", "location", "price", "rooms", "washrooms", "description"];
  if (!partial) {
    const missing = required.filter((k) => !body[k] || !String(body[k]).trim());
    if (missing.length) return `Missing required fields: ${missing.join(", ")}.`;
  }
  if (body.sellingType && !SELLING_TYPES.includes(body.sellingType)) return "Invalid selling type.";
  if (body.propertyType && !PROPERTY_TYPES.includes(body.propertyType)) return "Invalid property type.";
  if (body.price !== undefined && body.price !== "" && !Number.isFinite(Number(String(body.price).replace(/,/g, "")))) {
    return "Price must be a number.";
  }
  return null;
}

function filesOf(req, field) {
  if (Array.isArray(req.files)) return field === "images" ? req.files : [];
  return req.files?.[field] ?? [];
}

exports.addProperty = async (req, res) => {
  try {
    const { title, sellingType, propertyType, location, price, area, washrooms, rooms, description } = req.body;
    const userId = req.userId;

    const invalid = validateCoreFields(req.body);
    if (invalid) return res.status(400).json({ message: invalid });

    const imageFiles = filesOf(req, "images");
    const videoFile = filesOf(req, "video")[0];

    if (!imageFiles.length) {
      return res.status(400).json({ message: "At least one image is required." });
    }
    if (imageFiles.length > MAX_IMAGES) {
      return res.status(400).json({ message: `You can upload up to ${MAX_IMAGES} images.` });
    }

    const [imageUrls, video] = await Promise.all([uploadImages(imageFiles), uploadVideo(videoFile)]);

    const property = await PropertyModel.create({
      title: String(title).trim(),
      sellingType,
      propertyType,
      location: String(location).trim(),
      price: String(price).replace(/,/g, "").trim(),
      area,
      washrooms: String(washrooms),
      rooms: String(rooms),
      description,
      amenities: parseAmenities(req.body.amenities),
      owner: userId,
      images: imageUrls,
      ...(video ? { video } : {}),
    });

    await UserModel.updateOne({ _id: userId }, { $push: { myProperties: { propId: property._id } } });

    await pushUserNotification(userId, {
      title: "Listing published",
      body: `Your listing "${property.title}" is now live.`,
      kind: NOTIFICATION_KINDS.LISTING_LIVE,
      propId: property._id,
    });

    return res.status(200).json({ success: true, property: property._id });
  } catch (err) {
    return sendServerError(res, err, "addProperty");
  }
};

/**
 * POST /api/property/edit-property (multipart)
 * Fields: _id, any core field, amenities, keepImages (JSON array of existing URLs, in display order),
 *         images[] (new files appended after kept ones), video (replace), removeVideo ("true").
 */
exports.editProperty = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id || !isValidObjectId(_id)) {
      return res.status(400).json({ message: "Invalid property id." });
    }

    const property = await PropertyModel.findOne({ _id, owner: req.userId });
    if (!property) {
      return res.status(403).json({ message: "Not authorized or property not found." });
    }

    const invalid = validateCoreFields(req.body, { partial: true });
    if (invalid) return res.status(400).json({ message: invalid });

    const editable = ["title", "sellingType", "propertyType", "location", "price", "area", "washrooms", "rooms", "description"];
    for (const key of editable) {
      if (req.body[key] !== undefined && String(req.body[key]).trim() !== "") {
        property[key] = key === "price" ? String(req.body[key]).replace(/,/g, "").trim() : String(req.body[key]).trim();
      }
    }
    if (req.body.amenities !== undefined) property.amenities = parseAmenities(req.body.amenities);

    // Images: keep the listed existing ones (in the given order), then append new uploads.
    let keep = property.images;
    if (req.body.keepImages !== undefined) {
      try {
        const parsed = JSON.parse(req.body.keepImages);
        if (Array.isArray(parsed)) keep = parsed.filter((u) => property.images.includes(u));
      } catch {
        return res.status(400).json({ message: "keepImages must be a JSON array." });
      }
    }
    const newImageFiles = filesOf(req, "images");
    if (keep.length + newImageFiles.length === 0) {
      return res.status(400).json({ message: "A listing needs at least one image." });
    }
    if (keep.length + newImageFiles.length > MAX_IMAGES) {
      return res.status(400).json({ message: `You can have up to ${MAX_IMAGES} images.` });
    }

    const removedImages = property.images.filter((u) => !keep.includes(u));
    const newVideoFile = filesOf(req, "video")[0];
    const removeVideo = String(req.body.removeVideo) === "true";
    const oldVideoId = property.video?.publicId || null;

    const [newUrls, newVideo] = await Promise.all([uploadImages(newImageFiles), uploadVideo(newVideoFile)]);
    property.images = [...keep, ...newUrls];

    let videoToDestroy = null;
    if (newVideo) {
      property.video = newVideo;
      videoToDestroy = oldVideoId;
    } else if (removeVideo) {
      property.video = { url: null, publicId: null, thumbnail: null, duration: null };
      videoToDestroy = oldVideoId;
    }

    await property.save();
    destroyAssets({ imageUrls: removedImages, videoPublicId: videoToDestroy }).catch(() => {});

    return res.status(200).json({ success: true, property: property.toObject() });
  } catch (err) {
    return sendServerError(res, err, "editProperty");
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
    })
      .select("_id title images video")
      .lean();

    if (!property) {
      return res.status(403).json({
        success: false,
        message: "Not authorized or property not found.",
      });
    }

    // Close any open bookings/visits for this property and let the people involved know.
    const openBookings = await BookingModel.find({ propId: property._id, active: true })
      .select("_id userId broker bType visitStatus")
      .lean();

    if (openBookings.length) {
      await BookingModel.updateMany(
        { _id: { $in: openBookings.map((b) => b._id) } },
        {
          $set: { active: false, updatedAt: new Date(), cancelledBy: "system" },
          $push: {
            timeline: { action: "cancelled", by: "system", note: "Listing was removed by the owner", at: new Date() },
          },
        },
      );
      await BookingModel.updateMany(
        { _id: { $in: openBookings.map((b) => b._id) }, bType: "visit", visitStatus: { $in: OPEN_VISIT_STATUSES } },
        { $set: { visitStatus: "cancelled" } },
      );
      await UserModel.updateMany(
        { _id: { $in: openBookings.map((b) => b.userId) } },
        { $pull: { bookedProperties: { $in: openBookings.map((b) => b._id) } } },
      );
      const msg = {
        title: "Listing removed",
        body: `"${property.title}" was removed by its owner, so your request was cancelled.`,
        kind: NOTIFICATION_KINDS.VISIT_CANCELLED,
      };
      await Promise.allSettled(
        openBookings.flatMap((b) => [
          pushUserNotification(b.userId, { ...msg, bookingId: b._id }),
          b.broker ? pushBrokerNotification(b.broker, { ...msg, bookingId: b._id }) : null,
        ]),
      );
    }

    await PropertyModel.deleteOne({ _id: property._id });

    await UserModel.updateMany(
      { $or: [{ "myProperties.propId": property._id }, { "saved.propId": property._id }] },
      { $pull: { myProperties: { propId: property._id }, saved: { propId: property._id } } },
    );

    destroyAssets({ imageUrls: property.images, videoPublicId: property.video?.publicId }).catch(() => {});

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "deleteProperty");
  }
};
