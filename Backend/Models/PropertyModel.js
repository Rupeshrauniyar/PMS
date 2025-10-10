const mongoose = require("mongoose");
const { UserModel } = require("./UserModel");

const PropertySchema = mongoose.Schema({
  images: [
    {
      type: String,
    },
  ],
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  rooms: {
    type: Number,
    required: true,
  },
  washrooms: {
    type: Number,
    required: true,
  },
  sellingType: {
    type: String,
    required: true,
    enum: ["Rent System", "Selling System"],
  },
  propertyType: {
    type: String,
    required: true,
    enum: ["House", "Room", "Plot"],
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  area: {
    type: Number,
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "ownerModel", // tells mongoose which collection to use
  },
  ownerModel: {
    type: String,
    required: true,
    enum: ["users", "googleUsers"], // the collections it can reference
  },
  bookers: [
    {
      price: {
        type: Number,
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: UserModel,
      },
      userModel: {
        type: String,
        required: true,
        enum: ["users", "googleUsers"], // the collections it can reference
      },
      date: {
        type: String,
        required: true,
      },
    },
  ],
});

const PropertyModel = mongoose.model("property", PropertySchema);
module.exports = PropertyModel;
