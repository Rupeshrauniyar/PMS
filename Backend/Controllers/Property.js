const PropertyModel = require("../Models/PropertyModel");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
require("dotenv").config();
const { client } = require("../DB/Redis");
const cloudinary = require("cloudinary").v2;
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
      token,
    } = req.body;

    if (
      !title ||
      !sellingType ||
      !propertyType ||
      !location ||
      !price ||
      !rooms ||
      !washrooms ||
      !description ||
      !token
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pLimit = require("p-limit");
    const limit = pLimit(3); // optional: limit concurrent uploads

    const imageUrls = await Promise.all(
      req.files.map((file) =>
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
              stream.end(file.buffer);
            })
        )
      )
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
      owner: decoded.id,
      ownerModel: decoded.type === "google" ? "googleUsers" : "users",
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
    await client.sendCommand([
      "JSON.ARRINSERT",
      `property:${propertyType}`,
      ".",
      "0",
      JSON.stringify(propertySafe),
    ]);

    // await client.lTrim(`property:${propertyType}`, 0, 5); // indexes are 0-based
    await UserModel.findByIdAndUpdate(decoded.id, {
      $push: { myProperties: { propId: property._id } },
    });

    res.status(200).json({ success: true, property: property._id });
    // res.status(500).json({ success: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong." });
  }
};
exports.deleteProperty = async (req, res) => {
  try {
    const Data = req.body;
    console.log(Data);
    if (!Data) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting property, Insufficient Data",
      });
    }
    const decode = jwt.verify(Data.token, process.env.JWT_SECRET);
    const update = await UserModel.findOneAndUpdate(
      { _id: decode.id },
      {
        $pull: { myProperties: { propId: Data._id } },
      }
    );
    if (!update.modifiedCount > 0) {
      res.status(500).json({
        success: false,
        message: "You are not Authenticated",
      });
    } else {
      const arr = await client.sendCommand([
        "JSON.GET",
        `property:${Data.propertyType}`,
        ".",
      ]);
      // console.log(arr)

      if (!arr.length > 0) {
        await PropertyModel.findOneAndDelete({ _id: Data._id });
        res.status(200).json({ success: true });
      }
      await PropertyModel.findOneAndDelete({ _id: Data._id });
      const array = JSON.parse(arr);
      // 2. Remove object by property (example: id)
      const newArray = array.filter((item) => item._id !== Data._id);

      await client.sendCommand([
        "JSON.SET",
        `property:${Data.propertyType}`,
        ".",
        JSON.stringify(newArray),
      ]);
      res.status(200).json({ success: true });
    }
    // 1. Get the array
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting property.",
    });
  }
};
exports.editProperty = async (req, res) => {};
