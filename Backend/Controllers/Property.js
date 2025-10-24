const cloudinary = require("cloudinary").v2;
const PropertyModel = require("../Models/PropertyModel");
// const BookingModel = require("../Models/BookingModel");
const jwt = require("jsonwebtoken");
const { UserModel, GoogleUserModel } = require("../Models/UserModel");
require("dotenv").config();
const admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
exports.addProperty = async (req, res) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
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
      token,
    } = req.body;
    if (
      title &&
      sellingType &&
      propertyType &&
      location &&
      price &&
      area &&
      washrooms &&
      rooms &&
      description &&
      token
    ) {
      const files = req.files;
      const uploadImages = (file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "PMS_PROPERTIES" },
            (err, uploaded) => {
              if (err) {
                console.error(err);
                return reject(err);
              }
              // console.log("✅ Uploaded:", uploaded.secure_url);
              resolve(uploaded.secure_url);
            }
          );
          stream.end(file.buffer);
        });
      };
      const imageUrls = await Promise.all(
        files.map((file) => uploadImages(file))
      );
      if (imageUrls) {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
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
          owner: decodedToken.id,
          ownerModel: decodedToken?.type === "google" ? "googleUsers" : "users",
          images: imageUrls,
        });

        if (property) {
          if (decodedToken?.type === "google") {
            await GoogleUserModel.findOneAndUpdate(
              {
                _id: decodedToken.id,
              },
              {
                $push: {
                  myProperties: property._id,
                },
              }
            );
          } else {
            await UserModel.findOneAndUpdate(
              {
                _id: decodedToken.id,
              },
              {
                $push: {
                  myProperties: property._id,
                },
              }
            );
          }

          res.status(200).json({ success: true, property: property._id });
        } else {
          res.status(500).json({ error: "Something went wrong." });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};
exports.getProperty = async (req, res) => {
  try {
    const Data = req.body;
    // console.log(Data);
    if (Data?.type) {
      const Properties = await PropertyModel.find({
        propertyType: Data.type,
      }).select("-owner -bookers -ownerModel");
      if (Properties?.length > 0) {
        res.status(200).json({ Properties, success: true });
      } else {
        res.status(200).json({
          message: "No posts available yet",
          Properties: [],
        });
      }
    } else if (Data._id) {
      const Property = await PropertyModel.findOne({
        _id: Data._id,
      }).select("-owner  -ownerModel");
      if (Property) {
        res.status(200).json({ Property, success: true });
      } else {
        res.status(200).json({
          message: "No properties available yet",
          Property: [],
        });
      }
    } else {
      res.status(404).json({ error: "No data found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
};
exports.getUserProperty = async (req, res) => {
  try {
    const Data = req.body;
    if (!Data) {
      res.status(500).json({ error: "Something went wrong." });
    }
    let prop;
    const decoded = jwt.verify(Data.token, process.env.JWT_SECRET);
    // console.log(decoded)
    if (decoded.type === "google") {
      prop = await GoogleUserModel.findOne({ _id: decoded.id })
        .populate("myProperties")
        .select("-bookers");
    } else {
      prop = await UserModel.findOne({ _id: decoded.id })
        .populate("myProperties")
        .select("-_id -email -username -password -phone -bookers");
    }
    // console.log(prop);

    if (prop) {
      // console.log(prop.myProperties);
      // prop.myProperties.bookers = prop.myProperties.bookers.length;
      res.status(200).json({ prop: prop.myProperties });
    } else {
      res.status(200).json({ prop: prop.myProperties });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};
exports.bookProperty = async (req, res) => {
  try {
    const Data = req.body;
    // console.log(Data);
    if (!Data || !Data.token || !Data.price || !Data.date) {
      return res.status(403).json({ message: "Something went wrong." });
    }
    // console.log(Data);
    const decode = jwt.verify(Data.token, process.env.JWT_SECRET);
    // console.log(decode);
    let type;
    if (decode.type === "google") {
      type = "googleUsers";
    } else {
      type = "users";
    }
    const prop = await PropertyModel.findOneAndUpdate(
      {
        _id: Data.propId,
      },
      {
        $push: {
          bookers: {
            price: Data.price,
            userId: Data.userId,
            date: Data.date,
            userModel: type,
          },
        },
      }
    ).populate("owner");

    if (decode.type === "google") {
      await GoogleUserModel.findOneAndUpdate(
        { _id: Data.userId },
        {
          $push: {
            bookedProperties: {
              propId: Data.propId,
              price: Data.price,
              date: Data.date,
            },
          },
        }
      );
    } else {
      await UserModel.findOneAndUpdate(
        { _id: Data.userId },
        {
          $push: {
            bookedProperties: {
              propId: Data.propId,
              price: Data.price,
              date: Data.date,
            },
          },
        }
      );
    }
    // console.log(prop);
    if (prop.owner && prop.owner.FCMtokens?.length > 0) {
      const tokens = prop.owner.FCMtokens;
      // prop.owner.FCMtokens.map((data) => tokens.push(data.token));
      const payload = {
        notification: {
          title: "Booking Confirmed",
          body: `Your property has been Booked for रु.${Data.price}`,
          // image: "https://pmsnepal.vercel.app/web-app-manifest-512x512.png",
          // sound: "default",
        },
      };
      // console.log(tokens);
      // Send to all tokens
      await admin
        .messaging()
        .sendEachForMulticast({ tokens, ...payload })
        .then(() => {
          console.log("Notification sent");
        });
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
exports.searchProperty = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value)
      return res.status(403).json({ message: "Something went wrong." });

    const query = value.toLowerCase().trim();
    let filters = {};
    let orFilters = [];

    // 1️⃣ Detect price number
    const priceMatch = query.match(/\d+/);
    if (priceMatch) {
      const price = parseInt(priceMatch[0]);
      if (
        query.includes("under") ||
        query.includes("below") ||
        query.includes("less than")
      ) {
        filters.price = { $lte: price };
      } else if (
        query.includes("above") ||
        query.includes("over") ||
        query.includes("more than")
      ) {
        filters.price = { $gte: price };
      } else {
        // If only number mentioned, show around that number (±20%)
        filters.price = { $gte: price * 0.8, $lte: price * 1.2 };
      }
    }

    // 2️⃣ Text search on multiple fields
    orFilters.push({ title: { $regex: query, $options: "i" } });
    orFilters.push({ description: { $regex: query, $options: "i" } });
    orFilters.push({ propertyType: { $regex: query, $options: "i" } });
    orFilters.push({ location: { $regex: query, $options: "i" } });

    // 3️⃣ Build final query
    let finalQuery = {};
    if (Object.keys(filters).length > 0) {
      finalQuery = {
        $and: [{ ...filters }, { $or: orFilters }],
      };
    } else {
      finalQuery = { $or: orFilters };
    }

    // 4️⃣ Execute query
    const props = await PropertyModel.find(finalQuery);
    res.status(200).json({ props });
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong.", error: err });
  }
};
