const PropertyModel = require("../Models/PropertyModel");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
require("dotenv").config();
const admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");
const { client } = require("../DB/Redis");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const imageQueue = require("../Services/ImageQueue");

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
      images: [],
    });
    await imageQueue.add("ADD", {
      files: req.files,
      propertyId: property.id,
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
    await client.sendCommand([
      "JSON.ARRTRIM",
      `property:${propertyType}`,
      ".",
      "0",
      "4",
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

exports.getProperty = async (req, res) => {
  try {
    const Data = req.body; // or req.query if using GET
    if (!Data) {
      const Properties = await PropertyModel.find()
        .select("-owner -bookers -ownerModel")
        .lean()
        .limit(10) // max 50 results
        .sort({ createdAt: -1 }); // latest first;
      return res.status(200).json({
        Properties: Properties || [],
        success: Properties?.length > 0,
        message: Properties?.length ? undefined : "No posts available yet",
      });
    }
    if (Data.type) {
      const rawProps = await client.sendCommand([
        "JSON.GET",
        `property:${Data.type}`,
        ".",
      ]);
      // console.log(rawProps);
      if (rawProps && rawProps.length > 0) {
        // console.log(redisData);
        return res.status(200).json({
          Properties: JSON.parse(rawProps),
          success: rawProps?.length > 0,
          message: rawProps?.length ? undefined : "No properties available yet",
          redis: true,
        });
      } else {
        const Properties = await PropertyModel.find({
          propertyType: Data.type,
        })
          .select("-owner -bookers -ownerModel")
          .lean()
          .limit(10) // max 50 results
          .sort({ createdAt: -1 }); // latest first;
        await client.sendCommand([
          "JSON.SET",
          `property:${Data.type}`,
          ".",
          JSON.stringify(Properties),
        ]);
        return res.status(200).json({
          Properties: Properties || [],
          success: Properties?.length > 0,
          message: Properties?.length ? undefined : "No posts available yet",
        });
      }
    } else if (Data._id) {
      const Property = await PropertyModel.findById(Data._id)
        .select("-owner -ownerModel ")
        .lean();
      Property.bookers = Property.bookers.length;
      // console.log(Property.bookers);

      return res.status(200).json({
        Property: Property || [],
        success: !!Property,
        message: Property ? undefined : "No properties available yet",
      });
    } else if (Data.filter) {
      const Properties = await PropertyModel.find({
        _id: { $ne: Data.filter },
      })
        .select("-owner -bookers -ownerModel")
        .lean()
        .limit(10) // max 50 results
        .sort({ createdAt: -1 }); // latest first;
      return res.status(200).json({
        Properties: Properties || [],
        success: Properties?.length > 0,
        message: Properties?.length ? undefined : "No posts available yet",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

exports.getUserProperty = async (req, res) => {
  try {
    const { token, Type } = req.body;
    if (!token) return res.status(403).json({ error: "Token is required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const toPop = `${Type}.propId`; // Returns bookedProperties.propId
    const user = await UserModel.findById(decoded.id)
      .populate({
        path: toPop,
        select: "-owner -ownerModel -bookers", // remove sensitive info
      })
      .select("-password -FCMtokens");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ properties: user[Type], success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

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
    const { token, propId, price, date } = req.body;
    if (!token || !propId || !price || !date) {
      return res.status(403).json({ message: "Something went wrong." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const type = decode.type === "google" ? "googleUsers" : "users";

    // 1️⃣ Update property
    const prop = await PropertyModel.findByIdAndUpdate(
      propId,
      {
        $push: {
          bookers: {
            price,
            userId: decode.id,
            date,
            userModel: type,
          },
        },
      },
      { new: true }
    ).populate("owner");

    // 2️⃣ Update user
    await UserModel.findByIdAndUpdate(decode.id, {
      $push: { bookedProperties: { propId, price, date } },
    });

    // 3️⃣ Send FCM notification to property owner
    if (prop.owner?.FCMtokens?.length > 0) {
      const payload = {
        notification: {
          title: "Booking Confirmed",
          body: `Your property has been booked for रु.${price}`,
        },
      };
      await admin
        .messaging()
        .sendMulticast({ tokens: prop.owner.FCMtokens, ...payload });
    }

    res.status(200).json({ success: true, message: "Booked successfully" });
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong." });
  }
};

exports.searchProperty = async (req, res) => {
  try {
    const { value } = req.body;

    if (!value || !value.trim()) {
      return res.status(400).json({
        message: "Search query is required.",
        props: [],
      });
    }

    const query = value.toLowerCase().trim();
    let filters = {};
    let orFilters = [];
    let sortOptions = {};

    // ========================================
    // 1️⃣ ENHANCED PRICE DETECTION
    // ========================================

    // Convert k/K to thousands (e.g., "10k" → 10000)
    const normalizedQuery = query.replace(/(\d+)\s*k\b/gi, (match, num) => {
      return (parseInt(num) * 1000).toString();
    });

    // Extract all numbers from query
    const priceMatch = normalizedQuery.match(/\d+/g);

    if (priceMatch) {
      const prices = priceMatch.map((p) => parseInt(p));
      const mainPrice = Math.max(...prices); // Use the largest number as reference

      // Price range keywords
      if (
        query.includes("under") ||
        query.includes("below") ||
        query.includes("less than") ||
        query.includes("upto") ||
        query.includes("up to") ||
        query.includes("maximum") ||
        query.includes("max")
      ) {
        filters.price = { $lte: mainPrice };
        sortOptions.price = 1; // Sort ascending (cheapest first)
      } else if (
        query.includes("above") ||
        query.includes("over") ||
        query.includes("more than") ||
        query.includes("minimum") ||
        query.includes("min") ||
        query.includes("starting from") ||
        query.includes("from")
      ) {
        filters.price = { $gte: mainPrice };
        sortOptions.price = 1; // Sort ascending
      } else if (query.includes("between") && prices.length >= 2) {
        // Handle "between 10k and 20k"
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        filters.price = { $gte: minPrice, $lte: maxPrice };
        sortOptions.price = 1;
      } else if (query.includes("around") || query.includes("about")) {
        // If "around" mentioned, show ±30% range
        filters.price = {
          $gte: Math.floor(mainPrice * 0.7),
          $lte: Math.ceil(mainPrice * 1.3),
        };
      } else {
        // Default: show properties within ±25% of mentioned price
        filters.price = {
          $gte: Math.floor(mainPrice * 0.75),
          $lte: Math.ceil(mainPrice * 1.25),
        };
      }
    }

    // ========================================
    // 2️⃣ BEDROOMS/ROOMS DETECTION
    // ========================================
    const roomMatch = query.match(/(\d+)\s*(bhk|bedroom|room|bed)/i);
    if (roomMatch) {
      const roomCount = parseInt(roomMatch[1]);
      filters.rooms = roomCount;
    }

    // ========================================
    // 3️⃣ PROPERTY TYPE DETECTION
    // ========================================
    const propertyTypes = [
      "apartment",
      "flat",
      "house",
      "villa",
      "bungalow",
      "penthouse",
      "studio",
      "duplex",
      "farmhouse",
      "plot",
      "land",
      "commercial",
      "office",
      "shop",
      "warehouse",
    ];

    for (const type of propertyTypes) {
      if (query.includes(type)) {
        orFilters.push({
          propertyType: { $regex: type, $options: "i" },
        });
      }
    }

    // ========================================
    // 4️⃣ LOCATION KEYWORDS
    // ========================================
    const locationKeywords = [
      "near",
      "in",
      "at",
      "around",
      "close to",
      "nearby",
      "area",
      "locality",
    ];

    let locationQuery = query;
    locationKeywords.forEach((keyword) => {
      locationQuery = locationQuery.replace(
        new RegExp(`\\b${keyword}\\b`, "gi"),
        ""
      );
    });

    const searchTerms = locationQuery
      .replace(/\d+/g, "") // Remove numbers
      .replace(/[^\w\s]/g, "") // Remove special chars
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 2); // Only terms with 3+ chars

    if (searchTerms.length > 0) {
      searchTerms.forEach((term) => {
        orFilters.push({ title: { $regex: term, $options: "i" } });
        orFilters.push({ description: { $regex: term, $options: "i" } });
        orFilters.push({ location: { $regex: term, $options: "i" } });
        orFilters.push({ propertyType: { $regex: term, $options: "i" } });
      });
    }

    // Add full query search as well
    if (query.length > 2) {
      orFilters.push({ title: { $regex: query, $options: "i" } });
      orFilters.push({ description: { $regex: query, $options: "i" } });
      orFilters.push({ location: { $regex: query, $options: "i" } });
      orFilters.push({ propertyType: { $regex: query, $options: "i" } });
    }

    // ========================================
    // 6️⃣ BUILD FINAL QUERY
    // ========================================
    let finalQuery = {};

    if (Object.keys(filters).length > 0 && orFilters.length > 0) {
      // Both filters and text search
      finalQuery = {
        $and: [{ ...filters }, { $or: orFilters }],
      };
    } else if (Object.keys(filters).length > 0) {
      // Only filters (price, rooms, etc.)
      finalQuery = { ...filters };
    } else if (orFilters.length > 0) {
      // Only text search
      finalQuery = { $or: orFilters };
    } else {
      // Fallback: return all properties
      finalQuery = {};
    }

    // ========================================
    // 7️⃣ EXECUTE QUERY WITH SORTING
    // ========================================
    const props = await PropertyModel.find(finalQuery)
      .sort(sortOptions.price ? sortOptions : { createdAt: -1 }) // Sort by price or newest first
      .limit(100); // Limit results for performance

    // ========================================
    // 8️⃣ RESPONSE WITH METADATA
    // ========================================
    res.status(200).json({
      success: true,
      count: props.length,
      query: {
        original: value,
        filters: filters,
        searchTerms: searchTerms,
      },
      props: props,
      message:
        props.length === 0
          ? "No properties found matching your search."
          : `Found ${props.length} ${
              props.length === 1 ? "property" : "properties"
            }.`,
    });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching properties.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
      props: [],
    });
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
    if (!update._id) {
      res.status(500).json({
        success: false,
        message: "An error occurred while deleting property.",
      });
    } else {
      await PropertyModel.findOneAndDelete({ _id: Data._id });
      res.status(200).json({ success: true });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting property.",
    });
  }
};
