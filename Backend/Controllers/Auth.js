const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
const JWT_SECRET = process.env.JWT_SECRET;

function sanitizeUser(user) {
  const { password, FCMtokens, ...safeUser } = user.toObject();
  return safeUser;
}

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      email,
      username,
      password: hashedPassword,
      authProvider: "local",
    });

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).json({
      message: "User registered successfully.",
      token,
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// SIGNIN
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const user = await UserModel.findOne({
      email,
      authProvider: "local",
    }).populate("bookedProperties");
    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({
      message: "Signed in successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// SIGNIN WITH GOOGLE
exports.signinWithGoogle = async (req, res) => {
  try {
    const { email, uuid, username, pp } = req.body;
    let user = await UserModel.findOne({
      uuid,
      authProvider: "google",
    }).populate({
      path: "bookedProperties",
      // select: "propId",
    });
    if (!user) {
      user = await UserModel.create({
        email,
        uuid,
        username,
        pp,
        authProvider: "google",
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "Signed in successfully.", token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.signout = async (req, res) => {
  try {
    const { token, fcmToken } = req.body;
    const verify = jwt.verify(token, JWT_SECRET);
    if (!verify || !verify.id)
      return res.status(500).json({ message: "No id found", success: false });

    if (fcmToken?.length > 0) {
      await UserModel.findOneAndUpdate(
        { _id: verify.id },
        {
          $pull: { FCMtokens: fcmToken },
        },
      );
    }

    res.status(201).json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.editProfile = async (req, res) => {
  try {
    const Data = req.body;

    if (!Data || !Data.token) {
      return res.status(403).json({ message: "Something went wrong." });
    }

    const verify = jwt.verify(Data.token, process.env.JWT_SECRET);

    if (Data.currentPassword?.length > 0 && verify.type !== "google") {
      const user = await UserModel.findOne({ _id: verify.id });
      if (!user) {
        return res.status(403).json({ message: "User not found." });
      }

      const result = await bcrypt.compare(Data.currentPassword, user.password);
      if (!result) {
        return res
          .status(403)
          .json({ message: "Current password is invalid." });
      }

      const hashedPassword = await bcrypt.hash(Data.newPassword, 10);
      await UserModel.findOneAndUpdate(
        { _id: verify.id },
        { password: hashedPassword },
      );
      return res.status(200).json({ success: true });
    } else {
      const phone = Data.phone?.trim();

      const phoneExists = await UserModel.exists({
        phone,
        _id: { $ne: verify.id }, // ✅ verify.id, not verify._id
      });

      if (phoneExists) {
        return res
          .status(403)
          .json({ message: "Phone number already exists." });
      }

      const updateUser = await UserModel.findOneAndUpdate(
        { _id: verify.id }, // ✅ fixed here too
        {
          username: Data.username,
          phone: Data.phone,
        },
        { new: true },
      ).select("-password -FCMtokens");

      if (!updateUser) {
        return res.status(403).json({ message: "User not found." });
      }

      return res.status(200).json({ user: updateUser, success: true });
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(403).json({ message: "Phone number already exists." });
    }
    console.error("editProfile error:", err);
    return res.status(403).json({ message: "Something went wrong." });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id)
      return res.status(401).json({
        success: false,
      });
    const findUser = await UserModel.findOne({ _id: decoded.id }).populate({
      path: "bookedProperties",
      // select: "",
    });
    if (findUser) {
      const newToken = jwt.sign(
        { id: findUser._id, type: decoded.type },
        JWT_SECRET,
        {
          expiresIn: "7d",
        },
      );
      res.status(200).json({
        success: true,
        token: newToken,
        user: findUser,
      });
    } else {
      res.status(401).json({
        success: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ serverSuccess: false });
  }
};

exports.updateFCM = async (req, res) => {
  try {
    const { fcmToken, token } = req.body;
    console.log(fcmToken, token);
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decode);
    await UserModel.findOneAndUpdate(
      { _id: decode.id },
      {
        $addToSet: {
          FCMtokens: fcmToken,
        },
      },
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
