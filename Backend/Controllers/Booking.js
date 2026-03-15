const admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const PropertyModel = require("../Models/PropertyModel");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
require("dotenv").config();

exports.saveProperty = async (req, res) => {
  try {
    const { id, token, action } = req.body;
    // console.log(action);
    if (!id || !token)
      return res.status(403).json({ message: "Something went wrong." });

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
    res.status(403).json({ message: "Something went wrong." });
  }
};

exports.bookProperty = async (req, res) => {
  try {
    const { token, propId, price, date, bType, note } = req.body;

    if (!token || !propId || !price || !bType) {
      return res.status(403).json({ message: "Something went wrong." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const type = decode.type === "google" ? "googleUsers" : "users";

    // 1️⃣ Get property first
    const prop = await PropertyModel.findById(propId).populate("owner");

    if (!prop) {
      return res.status(404).json({ message: "Property not found." });
    }

    // 2️⃣ Check if property already booked
    if (prop.status === false) {
      return res.status(400).json({ message: "Property already booked." });
    }

    // 3️⃣ Check if user already booked this property
    const user = await UserModel.findById(decode.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const alreadyBooked = user.bookedProperties.some(
      (p) => p.propId.toString() === propId,
    );

    if (alreadyBooked) {
      return res
        .status(400)
        .json({ message: "You have already booked this property." });
    }

    // 4️⃣ Update property
    prop.bookers.push({
      price,
      userId: decode.id,
      date,
      bType,
      note,
      userModel: type,
    });

    prop.status = false; // mark as booked

    await prop.save();

    // 5️⃣ Update user
    user.bookedProperties.push({
      propId,
      price,
      bType,
      note,
      date,
    });

    await user.save();

    // 6️⃣ Send FCM notification
    if (prop.owner?.FCMtokens?.length > 0) {
      const payload = {
        notification: {
          title: "Property Booking",
          body: `Your property has been booked for Rs. ${new Intl.NumberFormat(
            "en-IN",
          ).format(price)}.00`,
        },
      };

      await admin.messaging().sendEachForMulticast({
        tokens: prop.owner.FCMtokens,
        ...payload,
      });

      console.log("Notification Sent.");
    }

    res.status(200).json({
      success: true,
      message: "Booked successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong." });
  }
};

exports.canclePropertyBooking = async (req, res) => {
  try {
    const { token, _id } = req.body;
    if (!token || !_id) {
      return res.status(500).json({ message: "Something went wrong." });
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (decode) {
      const update = await UserModel.updateOne(
        { _id: decode.id },
        {
          $pull: { bookedProperties: { propId: _id } },
        },
      );
      const prop = await PropertyModel.findOneAndUpdate(
        { _id },
        {
          $pull: { bookers: { userId: decode.id } },
        },
      ).populate("owner");
      if (prop.owner?.FCMtokens?.length > 0) {
        const payload = {
          notification: {
            title: "Property Booking",
            body: `Booking canceled by the buyer.`,
            // icon: "splash",
          },
          data: {
            click_action: "FLUTTER_NOTIFICATION_CLICK", // required for Android
            url: `/my/${_id}`, // 👈 your custom route
          },
        };
        await admin
          .messaging()
          .sendEachForMulticast({ tokens: prop.owner.FCMtokens, ...payload });
      }
      if (update.modifiedCount > 0) {
        res.status(200).json({ success: true });
      } else {
        res.status(403).json({ message: "Something went wrong." });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong." });
  }
};
exports.editPropertyBooking = async (req, res) => {};
exports.confirmPropertyBooking = async (req, res) => {
  try {
    const { token, _id, userId } = req.body;
    if ((!token || !_id, !userId)) {
      return res.status(500).json({ message: "Something went wrong." });
    }

    await UserModel.findOneAndUpdate(
      { _id: userId, "bookedProperties.propId": _id },
      {
        $set: { "bookedProperties.$.status": true },
      },
    );
    await PropertyModel.findOneAndUpdate(
      { _id: _id, "bookers.userId": userId },
      {
        $set: {
          "bookers.$.status": true,
          status: true,
        },
      },
    );
    res.status(200).json({ success: false });
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong." });
  }
};
exports.rejectPropertyBooking = async (req, res) => {};
