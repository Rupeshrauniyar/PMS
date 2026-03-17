const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
const PropertyModel = require("../Models/PropertyModel");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
const BookingModel = require("../Models/BookingModel");
require("dotenv").config();

if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Save / unsave a property for the current user
exports.saveProperty = async (req, res) => {
  try {
    const { id, token, action } = req.body;

    if (!id || !token) {
      return res.status(403).json({ message: "Something went wrong." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    if (action) {
      await UserModel.findByIdAndUpdate(decode.id, {
        $addToSet: { saved: { propId: id } }, // avoids duplicates
      });
      return res
        .status(200)
        .json({ success: true, message: "Saved successfully" });
    } else {
      await UserModel.findByIdAndUpdate(decode.id, {
        $pull: { saved: { propId: id } },
      });
      return res
        .status(200)
        .json({ success: true, message: "Unsaved successfully" });
    }
  } catch (err) {
    console.log(err);
    return res.status(403).json({ message: "Something went wrong." });
  }
};

// Create a new booking (visit or pay)
exports.bookProperty = async (req, res) => {
  try {
    const { token, propId, price, date, bType, note } = req.body;

    if (!token || !propId || !price || !bType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // 1️⃣ Get property with owner
    const prop = await PropertyModel.findById(propId).populate("owner");
    if (!prop) {
      return res.status(404).json({ message: "Property not found." });
    }

    // 2️⃣ Get user
    const user = await UserModel.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 3️⃣ Prevent duplicate active booking by same user for same property
    const existingActiveBooking = await BookingModel.findOne({
      userId: decode.id,
      propId,
      active: true,
    });

    if (existingActiveBooking) {
      return res.status(400).json({
        message: "You already have an active booking for this property.",
      });
    }

    // 4️⃣ Create booking
    const booking = await BookingModel.create({
      userId: decode.id,
      propId,
      price,
      date,
      bType,
      note,
    });

    // 5️⃣ Link booking to property and user
    prop.bookers.push(booking._id);
    await prop.save();

    user.bookedProperties.push(booking._id);
    await user.save();

    // 6️⃣ Notify owner (if FCM tokens present)
    if (prop.owner?.FCMtokens?.length > 0) {
      const payload = {
        notification: {
          title: "New Property Booking",
          body: `You have a new ${bType === "visit" ? "visit" : "booking"} request for Rs. ${new Intl.NumberFormat(
            "en-IN",
          ).format(price)}.00`,
        },
      };

      await admin.messaging().sendEachForMulticast({
        tokens: prop.owner.FCMtokens,
        ...payload,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booked successfully",
      booking,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// Cancel booking by buyer
exports.canclePropertyBooking = async (req, res) => {
  try {
    const { token, _id } = req.body;

    if (!token || !_id) {
      return res.status(400).json({ message: "Missing token or booking ID." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const booking = await BookingModel.findById(_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.userId.toString() !== decode.id) {
      return res
        .status(403)
        .json({ message: "Not allowed to cancel this booking." });
    }

    booking.active = false;
    await booking.save();

    // Remove references from user and property
    await UserModel.findByIdAndUpdate(decode.id, {
      $pull: { bookedProperties: booking._id },
    });

    const prop = await PropertyModel.findByIdAndUpdate(
      booking.propId,
      { $pull: { bookers: booking._id } },
      { new: true },
    ).populate("owner");

    // If there are no active, confirmed bookings left, mark property as available
    const activeConfirmedCount = await BookingModel.countDocuments({
      propId: booking.propId,
      active: true,
      status: true,
    });

    if (activeConfirmedCount === 0 && prop) {
      prop.status = false;
      await prop.save();
    }

    // Notify owner about cancellation
    if (prop?.owner?.FCMtokens?.length > 0) {
      const payload = {
        notification: {
          title: "Booking Cancelled",
          body: "A booking has been cancelled by the buyer.",
        },
      };

      await admin.messaging().sendEachForMulticast({
        tokens: prop.owner.FCMtokens,
        ...payload,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// Confirm booking by owner
exports.confirmPropertyBooking = async (req, res) => {
  try {
    const { token, _id } = req.body; // booking id

    if (!token || !_id) {
      return res.status(400).json({ message: "Missing token or booking ID." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const booking = await BookingModel.findById(_id).populate("propId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const prop = await PropertyModel.findById(booking.propId).populate(
      "owner",
    );

    if (!prop) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Only owner can confirm
    if (prop.owner._id.toString() !== decode.id) {
      return res
        .status(403)
        .json({ message: "Not allowed to confirm this booking." });
    }

    booking.status = true;
    await booking.save();

    // Mark property as booked
    prop.status = true;
    await prop.save();

    // Notify buyer that booking is confirmed
    const buyer = await UserModel.findById(booking.userId);
    if (buyer?.FCMtokens?.length > 0) {
      const payload = {
        notification: {
          title: "Booking Confirmed",
          body: "Your booking has been confirmed by the owner.",
        },
      };

      await admin.messaging().sendEachForMulticast({
        tokens: buyer.FCMtokens,
        ...payload,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// Reject booking by owner
exports.rejectPropertyBooking = async (req, res) => {
  try {
    const { token, _id } = req.body; // booking id

    if (!token || !_id) {
      return res.status(400).json({ message: "Missing token or booking ID." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const booking = await BookingModel.findById(_id).populate("propId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const prop = await PropertyModel.findById(booking.propId).populate(
      "owner",
    );

    if (!prop) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Only owner can reject
    if (prop.owner._id.toString() !== decode.id) {
      return res
        .status(403)
        .json({ message: "Not allowed to reject this booking." });
    }

    booking.active = false;
    booking.status = false;
    await booking.save();

    await UserModel.findByIdAndUpdate(booking.userId, {
      $pull: { bookedProperties: booking._id },
    });

    await PropertyModel.findByIdAndUpdate(booking.propId, {
      $pull: { bookers: booking._id },
    });

    // Notify buyer about rejection
    const buyer = await UserModel.findById(booking.userId);
    if (buyer?.FCMtokens?.length > 0) {
      const payload = {
        notification: {
          title: "Booking Rejected",
          body: "Your booking has been rejected by the owner.",
        },
      };

      await admin.messaging().sendEachForMulticast({
        tokens: buyer.FCMtokens,
        ...payload,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// Placeholder for future editing of a booking (date, note, etc.)
exports.editPropertyBooking = async (req, res) => {
  return res
    .status(501)
    .json({ message: "Editing bookings is not implemented yet." });
};
