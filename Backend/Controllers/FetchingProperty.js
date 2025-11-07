const { client } = require("../DB/Redis");
const PropertyModel = require("../Models/PropertyModel");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
require("dotenv").config();

exports.getProperty = async (req, res) => {
  try {
    const Data = req.body; // or req.query if using GET
    // console.log(Data)
    // if (!Data) {
    //   const Properties = await PropertyModel.find()
    //     .select("-owner -bookers -ownerModel")
    //     .lean()
    //     .limit(10) // max 50 results
    //     .sort({ createdAt: -1 }); // latest first;
    //   return res.status(200).json({
    //     Properties: Properties || [],
    //     success: Properties?.length > 0,
    //     message: Properties?.length ? undefined : "No property available yet",
    //   });
    // }
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
      if (!Property)
        return res.status(200).json({ message: "No property found." });
      else {
        Property.bookers = Property.bookers.length;
        // console.log(Property.bookers);

        return res.status(200).json({
          Property: Property || [],
          success: !!Property,
          message: Property ? undefined : "No properties available yet",
        });
      }
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
exports.getBookers = async (req, res) => {
  try {
    const Data = req.body; // or req.query if using GET
    // console.log(Data)

    const Property = await PropertyModel.findOne({ _id: Data._id })
      .populate({
        path: "bookers.userId",
        select: "username",
      })
      .lean();

    return res.status(200).json({
      Property: Property || [],
      success: Property?.length > 0,
      message: Property?.length ? undefined : "No property available.",
    });
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
    if (!user[Type])
      return res.status(200).json({ properties: [], success: true });

    res.status(200).json({ properties: user[Type], success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
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
