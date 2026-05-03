const PropertyModel = require("../Models/PropertyModel");
const UserModel = require("../Models/UserModel");
require("dotenv").config();
const { sendServerError } = require("../utils/authHelpers");

const SEARCH_PUBLIC_FIELDS =
  "title description location propertyType price rooms area washrooms sellingType images status createdAt";

exports.getProperty = async (req, res) => {
  try {
    const Data = req.body;

    if (Data == null || typeof Data !== "object") {
      return res.status(400).json({ error: "Invalid request body." });
    }

    if (Data.type) {
      const Properties = await PropertyModel.find({
        propertyType: Data.type,
        status: false,
      })
        .select("-owner -bookers -ownerModel")
        .lean()
        .limit(10)
        .sort({ createdAt: -1 });

      return res.status(200).json({
        Properties: Properties || [],
        message: Properties?.length ? undefined : "No properties available yet",
      });
    }

    if (Data._id) {
      const Property = await PropertyModel.findById(Data._id)
        .select("-owner -ownerModel ")
        .lean();

      if (!Property) {
        return res.status(200).json({ message: "No property found." });
      }

      Property.bookers = Property.bookers?.length ?? 0;

      return res.status(200).json({
        Property: Property || [],
        success: !!Property,
        message: Property ? undefined : "No properties available yet",
      });
    }

    if (Data.filter) {
      const Properties = await PropertyModel.find({
        _id: { $ne: Data.filter },
      })
        .select("-owner -bookers -ownerModel")
        .lean()
        .limit(10)
        .sort({ createdAt: -1 });

      return res.status(200).json({
        Properties: Properties || [],
        success: Properties?.length > 0,
        message: Properties?.length ? undefined : "No posts available yet",
      });
    }

    return res
      .status(400)
      .json({ error: "Specify type, _id, or filter in the request body." });
  } catch (err) {
    console.error(err);
    return sendServerError(res, err, "getProperty");
  }
};

exports.getBookers = async (req, res) => {
  try {
    const Data = req.body;

    if (!Data?._id) {
      return res.status(400).json({ error: "Property id is required." });
    }

    const Property = await PropertyModel.findOne({ _id: Data._id })
      .populate({
        path: "bookers",
        populate: {
          path: "userId",
          select: "username",
        },
      })
      .lean();

    return res.status(200).json({
      Property: Property || null,
      success: !!Property,
      message: Property ? undefined : "No property available.",
    });
  } catch (err) {
    console.error(err);
    return sendServerError(res, err, "getBookers");
  }
};

exports.getUserProperty = async (req, res) => {
  try {
    const { Type, NestedPop } = req.body;
    const userId = req.userId;

    const toPop = `${Type}`;
    if (NestedPop) {
      const user = await UserModel.findById(userId).populate({
        path: toPop,
        select: "-owner -ownerModel -bookers ",
        populate: {
          path: "propId",
          select: "",
        },
      });

      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user[Type]) {
        return res.status(200).json({ properties: [], success: true });
      }

      return res.status(200).json({ properties: user[Type], success: true });
    }

    const user = await UserModel.findById(userId)
      .populate({
        path: `${toPop}.propId`,
        select: "-owner -ownerModel -bookers ",
      })
      .select("-password -FCMtokens");

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user[Type]) {
      return res.status(200).json({ properties: [], success: true });
    }

    return res.status(200).json({ properties: user[Type], success: true });
  } catch (err) {
    console.error(err);
    return sendServerError(res, err, "getUserProperty");
  }
};

function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Coerce CSV body numbers; fields in DB may be strings. */
function parseNum(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function priceExprCondition(priceMin, priceMax) {
  if (priceMin == null && priceMax == null) return null;
  const innerParts = [
    { $ne: ["$$p", null] },
    ...(priceMin != null ? [{ $gte: ["$$p", priceMin] }] : []),
    ...(priceMax != null ? [{ $lte: ["$$p", priceMax] }] : []),
  ];
  return {
    $expr: {
      $let: {
        vars: {
          p: {
            $convert: {
              input: { $trim: { input: "$price" } },
              to: "double",
              onError: null,
              onNull: null,
            },
          },
        },
        in: { $and: innerParts },
      },
    },
  };
}

/** Trimmed string numeric field comparison (rooms, washrooms stored as strings). */
function intFieldExpr(fieldRef, numMin, numMax) {
  if (numMin == null && numMax == null) return null;
  const innerParts = [
    { $ne: ["$$n", null] },
    ...(numMin != null ? [{ $gte: ["$$n", numMin] }] : []),
    ...(numMax != null ? [{ $lte: ["$$n", numMax] }] : []),
  ];
  return {
    $expr: {
      $let: {
        vars: {
          n: {
            $convert: {
              input: { $trim: { input: fieldRef } },
              to: "int",
              onError: null,
              onNull: null,
            },
          },
        },
        in: { $and: innerParts },
      },
    },
  };
}

/** Optional natural-language hints for price / rooms when `value` is non-empty. */
function parseNlpPriceRooms(trimmedLower) {
  const out = {
    priceMin: undefined,
    priceMax: undefined,
    roomsExact: undefined,
    sortByPrice: false,
    typeRegexOr: [],
  };
  const query = trimmedLower.trim();
  if (query.length < 2) return out;

  const normalizedQuery = query.replace(/(\d+)\s*k\b/gi, (_, num) =>
    String(parseInt(num, 10) * 1000),
  );
  const priceMatch = normalizedQuery.match(/\d+/g);

  if (priceMatch) {
    const prices = priceMatch.map((p) => parseInt(p, 10));
    const mainPrice = Math.max(...prices);
    if (
      query.includes("under") ||
      query.includes("below") ||
      query.includes("less than") ||
      query.includes("upto") ||
      query.includes("up to") ||
      query.includes("maximum") ||
      query.includes("max")
    ) {
      out.priceMax = mainPrice;
      out.sortByPrice = true;
    } else if (
      query.includes("above") ||
      query.includes("over") ||
      query.includes("more than") ||
      query.includes("minimum") ||
      query.includes("min") ||
      query.includes("starting from") ||
      query.includes("from")
    ) {
      out.priceMin = mainPrice;
      out.sortByPrice = true;
    } else if (query.includes("between") && prices.length >= 2) {
      out.priceMin = Math.min(...prices);
      out.priceMax = Math.max(...prices);
      out.sortByPrice = true;
    } else if (query.includes("around") || query.includes("about")) {
      out.priceMin = Math.floor(mainPrice * 0.7);
      out.priceMax = Math.ceil(mainPrice * 1.3);
      out.sortByPrice = true;
    } else {
      out.priceMin = Math.floor(mainPrice * 0.75);
      out.priceMax = Math.ceil(mainPrice * 1.25);
      out.sortByPrice = true;
    }
  }

  const roomMatch = query.match(/(\d+)\s*(bhk|bedroom|room|bed)/i);
  if (roomMatch) out.roomsExact = parseInt(roomMatch[1], 10);

  const vocabTypes = [
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
  vocabTypes.forEach((type) => {
    if (query.includes(type)) {
      out.typeRegexOr.push({ propertyType: { $regex: type, $options: "i" } });
    }
  });

  return out;
}

function buildTextOrFilters(trimmedForDisplay, trimmedLower) {
  const orFilters = [];

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
  let locationQuery = trimmedLower;
  locationKeywords.forEach((keyword) => {
    locationQuery = locationQuery.replace(new RegExp(`\\b${keyword}\\b`, "gi"), "");
  });

  const searchTerms = locationQuery
    .replace(/\d+/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  searchTerms.forEach((term) => {
    const esc = escapeRegex(term);
    orFilters.push({ title: { $regex: esc, $options: "i" } });
    orFilters.push({ description: { $regex: esc, $options: "i" } });
    orFilters.push({ location: { $regex: esc, $options: "i" } });
    orFilters.push({ propertyType: { $regex: esc, $options: "i" } });
  });

  if (trimmedLower.length > 2) {
    const escPhrase = escapeRegex(trimmedForDisplay.trim());
    orFilters.push({ title: { $regex: escPhrase, $options: "i" } });
    orFilters.push({ description: { $regex: escPhrase, $options: "i" } });
    orFilters.push({ location: { $regex: escPhrase, $options: "i" } });
    orFilters.push({ propertyType: { $regex: escPhrase, $options: "i" } });
  }

  return { orFilters, searchTerms };
}

const SELLING_TYPES_VALID = ["Rent System", "Selling System"];
const PROPERTY_TYPES_VALID = ["House", "Room", "Plot"];

exports.searchProperty = async (req, res) => {
  try {
    const body = req.body || {};
    const rawValue = typeof body.value === "string" ? body.value : "";
    const trimmedDisplay = rawValue.trim();
    const trimmedLower = trimmedDisplay.toLowerCase();

    const f =
      body.filters && typeof body.filters === "object" && body.filters !== null
        ? body.filters
        : {};

    const explicit = {
      priceMin: parseNum(f.priceMin),
      priceMax: parseNum(f.priceMax),
      roomsMin: parseNum(f.roomsMin),
      roomsMax: parseNum(f.roomsMax),
      washroomsMin: parseNum(f.washroomsMin),
      location: typeof f.location === "string" ? f.location.trim() : "",
      sellingType: f.sellingType,
      propertyType: f.propertyType,
    };

    const hasExplicitFilters =
      explicit.priceMin != null ||
      explicit.priceMax != null ||
      explicit.roomsMin != null ||
      explicit.roomsMax != null ||
      explicit.washroomsMin != null ||
      explicit.location.length > 0 ||
      (explicit.sellingType &&
        SELLING_TYPES_VALID.includes(explicit.sellingType)) ||
      (explicit.propertyType &&
        PROPERTY_TYPES_VALID.includes(explicit.propertyType));

    if (!trimmedLower && !hasExplicitFilters) {
      return res.status(200).json({
        success: true,
        count: 0,
        props: [],
        message: "Enter keywords or adjust filters to search.",
      });
    }

    const nlp = trimmedLower ? parseNlpPriceRooms(trimmedLower) : {};

    const effPriceMin = explicit.priceMin ?? nlp.priceMin;
    const effPriceMax = explicit.priceMax ?? nlp.priceMax;

    let effRoomsMin = explicit.roomsMin;
    let effRoomsMax = explicit.roomsMax;
    if (effRoomsMin == null && effRoomsMax == null && nlp.roomsExact != null) {
      effRoomsMin = nlp.roomsExact;
      effRoomsMax = nlp.roomsExact;
    }

    const sortNumericPrice = Boolean(
      explicit.priceMin != null ||
        explicit.priceMax != null ||
        nlp.sortByPrice,
    );

    const andConditions = [{ status: false }];

    if (
      explicit.sellingType &&
      SELLING_TYPES_VALID.includes(explicit.sellingType)
    ) {
      andConditions.push({ sellingType: explicit.sellingType });
    }

    if (
      explicit.propertyType &&
      PROPERTY_TYPES_VALID.includes(explicit.propertyType)
    ) {
      andConditions.push({ propertyType: explicit.propertyType });
    } else if (nlp.typeRegexOr && nlp.typeRegexOr.length > 0) {
      andConditions.push({ $or: nlp.typeRegexOr });
    }

    if (explicit.location.length > 0) {
      const esc = escapeRegex(explicit.location);
      andConditions.push({
        location: { $regex: esc, $options: "i" },
      });
    }

    const pExpr = priceExprCondition(effPriceMin, effPriceMax);
    if (pExpr) andConditions.push(pExpr);

    const roomsExpr = intFieldExpr("$rooms", effRoomsMin, effRoomsMax);
    if (roomsExpr) andConditions.push(roomsExpr);

    if (explicit.washroomsMin != null) {
      const washExpr = intFieldExpr(
        "$washrooms",
        explicit.washroomsMin,
        undefined,
      );
      if (washExpr) andConditions.push(washExpr);
    }

    let searchTerms = [];
    if (trimmedLower.length >= 3) {
      const text = buildTextOrFilters(trimmedDisplay, trimmedLower);
      searchTerms = text.searchTerms;
      if (text.orFilters.length > 0)
        andConditions.push({ $or: text.orFilters });
    }

    const finalQuery = { $and: andConditions };

    /* Avoid returning every listing when the query is effectively empty */
    if (andConditions.length === 1) {
      return res.status(200).json({
        success: true,
        count: 0,
        props: [],
        message:
          "Type at least 3 characters in the keyword box, or choose filters (e.g. price range, location).",
      });
    }

    let props = await PropertyModel.find(finalQuery)
      .select(SEARCH_PUBLIC_FIELDS)
      .limit(120)
      .lean();

    if (sortNumericPrice) {
      props.sort((a, b) => {
        const pa = parseNum(a.price);
        const pb = parseNum(b.price);
        const na = pa != null ? pa : Number.POSITIVE_INFINITY;
        const nb = pb != null ? pb : Number.POSITIVE_INFINITY;
        return na - nb;
      });
    } else {
      props.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    props = props.slice(0, 100);

    return res.status(200).json({
      success: true,
      count: props.length,
      query: {
        value: trimmedDisplay,
        resolved: {
          priceMin: effPriceMin ?? null,
          priceMax: effPriceMax ?? null,
          roomsMin: effRoomsMin ?? null,
          roomsMax: effRoomsMax ?? null,
        },
        explicit,
        searchTerms,
      },
      props,
      message:
        props.length === 0
          ? "No properties found matching your search."
          : `Found ${props.length} ${
              props.length === 1 ? "property" : "properties"
            }.`,
    });
  } catch (err) {
    console.error("Search Error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while searching properties.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
      props: [],
    });
  }
};
