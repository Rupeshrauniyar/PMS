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

    // 1️⃣ Update property
    const prop = await PropertyModel.findByIdAndUpdate(propId, {
      $push: {
        bookers: {
          price,
          userId: decode.id,
          date,
          bType,
          note,
          userModel: type,
        },
      },
    }).populate("owner");

    // 2️⃣ Update user
    await UserModel.findByIdAndUpdate(decode.id, {
      $push: { bookedProperties: { propId, price, bType, note, date } },
    });

    // 3️⃣ Send FCM notification to property owner
    if (prop.owner?.FCMtokens?.length > 0) {
      const payload = {
        notification: {
          title: "Property Booking",
          body: `Your property has been booked for Rs. ${new Intl.NumberFormat(
            "en-IN"
          ).format(price)}.00`,
          // icon: "splash", // ✅ logo for notification
        },
      };

      await admin.messaging().sendEachForMulticast({
        tokens: prop.owner.FCMtokens,
        ...payload,
      });
      console.log("SENT.");
    }

    res.status(200).json({ success: true, message: "Booked successfully" });
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
        }
      );
      const prop = await PropertyModel.findOneAndUpdate(
        { _id },
        {
          $pull: { bookers: { userId: decode.id } },
        }
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
      }
    );
    await PropertyModel.findOneAndUpdate(
      { _id: _id, "bookers.userId": userId },
      { $set: { "bookers.$.status": true } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong." });
  }
};
exports.rejectPropertyBooking = async (req, res) => {};
