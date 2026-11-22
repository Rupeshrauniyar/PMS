const express = require("express");
const router = express.Router();
const {
  addProperty,
  editProperty,
  deleteProperty,
} = require("../Controllers/Property");
const multer = require("multer");
const { requireUserAuth } = require("../middleware/requireAuth");

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 16 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "images" && file.mimetype.startsWith("image/")) return cb(null, true);
    if (file.fieldname === "video" && file.mimetype.startsWith("video/")) return cb(null, true);
    const err = new Error(
      file.fieldname === "video"
        ? "The video must be a video file (MP4, MOV, WebM)."
        : "Only image files are allowed for photos.",
    );
    err.status = 400;
    return cb(err);
  },
});

const mediaFields = upload.fields([
  { name: "images", maxCount: 15 },
  { name: "video", maxCount: 1 },
]);

/** Wrap multer so upload errors become friendly 400s instead of 500s. */
function handleMedia(req, res, next) {
  mediaFields(req, res, (err) => {
    if (!err) {
      const tooBigImage = (req.files?.images || []).find((f) => f.size > MAX_IMAGE_BYTES);
      if (tooBigImage) {
        return res.status(400).json({ message: "Each photo must be 10 MB or smaller." });
      }
      return next();
    }
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "The video must be 50 MB or smaller."
          : err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Too many files, or only one video is allowed."
            : err.message;
      return res.status(400).json({ message });
    }
    return res.status(err.status || 400).json({ message: err.message || "Upload failed." });
  });
}

router.post("/add-property", requireUserAuth, handleMedia, addProperty);
router.post("/edit-property", requireUserAuth, handleMedia, editProperty);
router.post("/delete-property", requireUserAuth, deleteProperty);

module.exports = router;
