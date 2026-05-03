const PropertyModel = require("../Models/PropertyModel");
const UserModel = require("../Models/UserModel");
const BookingModel = require("../Models/BookingModel");
const { isValidObjectId, sendServerError } = require("../utils/authHelpers");
const {
  pushUserNotification,
  NOTIFICATION_KINDS,
} = require("../utils/notificationsHelper");

require("dotenv").config();

// Save / unsave a property for the current user
exports.saveProperty = async (req, res) => {
  try {
    const { id, action } = req.body;
    const userId = req.userId;

    if (!id) {
      return res.status(403).json({ message: "Something went wrong." });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid property id." });
    }

    if (action) {
      await UserModel.updateOne(
        { _id: userId },
        { $addToSet: { saved: { propId: id } } },
      );
      return res
        .status(200)
        .json({ success: true, message: "Saved successfully" });
    }

    await UserModel.updateOne(
      { _id: userId },
      { $pull: { saved: { propId: id } } },
    );
    return res
      .status(200)
      .json({ success: true, message: "Unsaved successfully" });
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "Something went wrong." });
  }
};

// Create a new booking (visit or pay)
exports.bookProperty = async (req, res) => {
  try {
    const { propId, price, date, bType, note } = req.body;
    const userId = req.userId;

    if (!propId || price == null || !bType) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    if (!isValidObjectId(propId)) {
      return res.status(400).json({ message: "Invalid property id." });
    }
    if (bType !== "visit" && bType !== "pay") {
      return res.status(400).json({ message: "Invalid booking type." });
    }

    const [prop, existingActiveBooking, userExists] = await Promise.all([
      PropertyModel.findById(propId)
        .populate({ path: "owner", select: "_id FCMtokens" })
        .lean(),
      BookingModel.findOne({
        userId,
        propId,
        active: true,
      })
        .select("_id")
        .lean(),
      UserModel.exists({ _id: userId }),
    ]);

    if (!prop) {
      return res.status(404).json({ message: "Property not found." });
    }
    if (!userExists) {
      return res.status(404).json({ message: "User not found." });
    }
    if (existingActiveBooking) {
      return res.status(400).json({
        message: "You already have an active booking for this property.",
      });
    }

    const booking = await BookingModel.create({
      userId,
      propId,
      price: String(price),
      date,
      bType,
      note,
    });

    await Promise.all([
      PropertyModel.updateOne(
        { _id: propId },
        { $push: { bookers: booking._id } },
      ),
      UserModel.updateOne(
        { _id: userId },
        { $push: { bookedProperties: booking._id } },
      ),
    ]);

    const ownerId = prop.owner?._id;
    const ownerTokens = prop.owner?.FCMtokens;
    if (ownerId) {
      const bodyText = `Someone requested a ${bType === "visit" ? "visit" : "payment booking"} · Rs. ${new Intl.NumberFormat(
        "en-IN",
      ).format(Number(price))}`;
      await pushUserNotification(
        ownerId,
        {
          title: "New booking request",
          body: bodyText,
          kind: NOTIFICATION_KINDS.BOOKING_NEW,
          propId,
        },
        ownerTokens ?? [],
      );
    }

    return res.status(200).json({
      success: true,
      message: "Booked successfully",
      booking,
    });
  } catch (err) {
    return sendServerError(res, err, "bookProperty");
  }
};

// Cancel booking by buyer
exports.canclePropertyBooking = async (req, res) => {
  try {
    const { _id } = req.body;
    const userId = req.userId;

    if (!_id) {
      return res.status(400).json({ message: "Missing booking ID." });
    }
    if (!isValidObjectId(_id)) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const booking = await BookingModel.findById(_id).lean();
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (String(booking.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to cancel this booking." });
    }

    await BookingModel.updateOne({ _id }, { $set: { active: false } });

    await Promise.all([
      UserModel.updateOne(
        { _id: userId },
        { $pull: { bookedProperties: booking._id } },
      ),
      PropertyModel.updateOne(
        { _id: booking.propId },
        { $pull: { bookers: booking._id } },
      ),
    ]);

    const prop = await PropertyModel.findById(booking.propId)
      .populate({ path: "owner", select: "_id FCMtokens" })
      .lean();

    const activeConfirmedCount = await BookingModel.countDocuments({
      propId: booking.propId,
      active: true,
      status: true,
    });

    if (activeConfirmedCount === 0 && prop) {
      await PropertyModel.updateOne({ _id: prop._id }, { $set: { status: false } });
    }

    const oid = prop?.owner?._id;
    if (oid) {
      await pushUserNotification(
        oid,
        {
          title: "Booking cancelled",
          body: "The buyer cancelled a booking request for your property.",
          kind: NOTIFICATION_KINDS.BOOKING_CANCELLED,
          propId: booking.propId,
        },
        prop.owner?.FCMtokens ?? [],
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "canclePropertyBooking");
  }
};

// Confirm booking by owner
exports.confirmPropertyBooking = async (req, res) => {
  try {
    const { _id } = req.body;
    const userId = req.userId;

    if (!_id) {
      return res.status(400).json({ message: "Missing booking ID." });
    }
    if (!isValidObjectId(_id)) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const booking = await BookingModel.findById(_id).lean();
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const prop = await PropertyModel.findById(booking.propId)
      .populate({ path: "owner", select: "_id" })
      .lean();

    if (!prop) {
      return res.status(404).json({ message: "Property not found." });
    }

    if (String(prop.owner._id) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to confirm this booking." });
    }

    await Promise.all([
      BookingModel.updateOne({ _id }, { $set: { status: true } }),
      PropertyModel.updateOne({ _id: prop._id }, { $set: { status: true } }),
    ]);

    const buyer = await UserModel.findById(booking.userId)
      .select("FCMtokens")
      .lean();

    await pushUserNotification(
      booking.userId,
      {
        title: "Booking confirmed",
        body: "The owner confirmed your booking. Open the listing for details.",
        kind: NOTIFICATION_KINDS.BOOKING_CONFIRMED,
        propId: booking.propId,
      },
      buyer?.FCMtokens ?? [],
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "confirmPropertyBooking");
  }
};

// Reject booking by owner
exports.rejectPropertyBooking = async (req, res) => {
  try {
    const { _id } = req.body;
    const userId = req.userId;

    if (!_id) {
      return res.status(400).json({ message: "Missing booking ID." });
    }
    if (!isValidObjectId(_id)) {
      return res.status(400).json({ message: "Invalid booking id." });
    }

    const booking = await BookingModel.findById(_id).lean();
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const prop = await PropertyModel.findById(booking.propId)
      .populate({ path: "owner", select: "_id" })
      .lean();

    if (!prop) {
      return res.status(404).json({ message: "Property not found." });
    }

    if (String(prop.owner._id) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to reject this booking." });
    }

    await Promise.all([
      BookingModel.updateOne(
        { _id },
        { $set: { active: false, status: false } },
      ),
      UserModel.updateOne(
        { _id: booking.userId },
        { $pull: { bookedProperties: booking._id } },
      ),
      PropertyModel.updateOne(
        { _id: booking.propId },
        { $pull: { bookers: booking._id } },
      ),
    ]);

    const buyer = await UserModel.findById(booking.userId)
      .select("FCMtokens")
      .lean();

    await pushUserNotification(
      booking.userId,
      {
        title: "Booking not accepted",
        body: "The owner rejected your booking for this listing.",
        kind: NOTIFICATION_KINDS.BOOKING_REJECTED,
        propId: booking.propId,
      },
      buyer?.FCMtokens ?? [],
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "rejectPropertyBooking");
  }
};

exports.editPropertyBooking = async (req, res) => {
  return res
    .status(501)
    .json({ message: "Editing bookings is not implemented yet." });
};
