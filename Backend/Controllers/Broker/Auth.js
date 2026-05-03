const bcrypt = require("bcryptjs");
const UserModel = require("../../Models/Broker/UserModel");
const {
  BCRYPT_ROUNDS,
  normalizeEmail,
  isValidEmail,
  sendServerError,
  decodeAccessFromRequest,
  tryUserIdFromRefreshCookie,
} = require("../../utils/authHelpers");
const {
  setSessionForUser,
  clearAuthCookies,
  rotateSessionFromPayload,
} = require("../../utils/authCookies");

const MIN_PASSWORD_LEN = 8;

function sanitizeUser(user) {
  if (!user) return user;
  const o = user.toObject ? user.toObject() : { ...user };
  const { password, FCMtokens, ...safe } = o;
  return safe;
}

exports.signup = async (req, res) => {
  try {
    const { password, username, phone } = req.body;
    const email = normalizeEmail(req.body?.email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    if (!username || !String(username).trim()) {
      return res.status(400).json({ message: "Username is required." });
    }
    if (password.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
      });
    }

    const existingUser = await UserModel.findOne({ email }).select("_id authProvider").lean();
    if (existingUser) {
      if (existingUser.authProvider === "google") {
        return res.status(409).json({
          code: "USE_GOOGLE",
          message:
            "This email is registered with Google. Sign in with Google instead.",
        });
      }
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newUser = await UserModel.create({
      email,
      username: String(username).trim(),
      phone,
      password: hashedPassword,
      authProvider: "local",
    });

    setSessionForUser(res, newUser, "broker");

    return res.status(200).json({
      message: "Broker registered successfully.",
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    return sendServerError(res, err, "broker signup");
  }
};

exports.signin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.authProvider === "google") {
      return res.status(401).json({
        code: "USE_GOOGLE",
        message:
          "This account uses Google sign-in. Please continue with Google.",
      });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    setSessionForUser(res, user, "broker");

    return res.status(200).json({
      message: "Signed in successfully.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    return sendServerError(res, err, "broker signin");
  }
};

exports.signinWithGoogle = async (req, res) => {
  try {
    const { email, uuid, username, pp } = req.body;
    if (!uuid || !email) {
      return res
        .status(400)
        .json({ message: "Email and Google id are required." });
    }

    const emailNorm = normalizeEmail(email);

    let user = await UserModel.findOne({
      uuid,
      authProvider: "google",
    });

    if (user) {
      setSessionForUser(res, user, "broker");
      return res.status(200).json({
        message: "Signed in successfully.",
        user: sanitizeUser(user),
      });
    }

    const existing = await UserModel.findOne({ email: emailNorm })
      .select("_id authProvider uuid")
      .lean();

    if (existing) {
      if (existing.authProvider === "local") {
        return res.status(409).json({
          code: "EMAIL_PASSWORD_ACCOUNT",
          message:
            "An account with this email already exists. Sign in with your email and password.",
        });
      }
      if (
        existing.authProvider === "google" &&
        String(existing.uuid) !== String(uuid)
      ) {
        return res.status(409).json({
          message:
            "This email is linked to a different Google account. Use the original Google sign-in.",
        });
      }
    }

    user = await UserModel.create({
      email: emailNorm,
      uuid,
      username,
      pp,
      authProvider: "google",
    });

    setSessionForUser(res, user, "broker");

    return res.status(200).json({
      message: "Signed in successfully.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    return sendServerError(res, err, "broker signinWithGoogle");
  }
};

exports.signout = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    const fromAccess = decodeAccessFromRequest(req, "broker");
    const fromRefresh = tryUserIdFromRefreshCookie(req, "broker");
    const uid = fromAccess?.id || fromRefresh?.id;

    clearAuthCookies(res, "broker");

    if (fcmToken?.length > 0 && uid) {
      await UserModel.updateOne(
        { _id: uid },
        { $pull: { FCMtokens: fcmToken } },
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "broker signout");
  }
};

exports.editProfile = async (req, res) => {
  try {
    const Data = req.body;
    const verify = { id: req.userId, type: req.accountType };

    if (Data.currentPassword?.length > 0 && verify.type !== "google") {
      const user = await UserModel.findOne({ _id: verify.id }).select("+password");
      if (!user) {
        return res.status(403).json({ message: "User not found." });
      }

      const result = await bcrypt.compare(Data.currentPassword, user.password);
      if (!result) {
        return res
          .status(403)
          .json({ message: "Current password is invalid." });
      }

      if (!Data.newPassword || Data.newPassword.length < MIN_PASSWORD_LEN) {
        return res.status(400).json({
          message: `New password must be at least ${MIN_PASSWORD_LEN} characters.`,
        });
      }

      const hashedPassword = await bcrypt.hash(Data.newPassword, BCRYPT_ROUNDS);
      await UserModel.updateOne({ _id: verify.id }, { password: hashedPassword });
      return res.status(200).json({ success: true });
    }

    const phone = Data.phone?.trim();
    if (phone) {
      const phoneExists = await UserModel.exists({
        phone,
        _id: { $ne: verify.id },
      });
      if (phoneExists) {
        return res.status(403).json({ message: "Phone number already exists." });
      }
    }

    const updateUser = await UserModel.findOneAndUpdate(
      { _id: verify.id },
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
  } catch (err) {
    if (err.code === 11000) {
      return res.status(403).json({ message: "Phone number already exists." });
    }
    console.error("broker editProfile error:", err);
    return res.status(403).json({ message: "Something went wrong." });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    let payload = decodeAccessFromRequest(req, "broker");
    let findUser;

    if (!payload) {
      const refreshPayload = tryUserIdFromRefreshCookie(req, "broker");
      if (!refreshPayload?.id) {
        return res.status(401).json({ success: false });
      }

      findUser = await UserModel.findById(refreshPayload.id).select(
        "-password -FCMtokens",
      );

      if (!findUser) {
        clearAuthCookies(res, "broker");
        return res.status(401).json({ success: false });
      }

      rotateSessionFromPayload(res, refreshPayload, "broker");
    } else {
      findUser = await UserModel.findById(payload.id).select(
        "-password -FCMtokens",
      );

      if (!findUser) {
        clearAuthCookies(res, "broker");
        return res.status(401).json({ success: false });
      }
    }

    return res.status(200).json({
      success: true,
      user: findUser,
    });
  } catch (err) {
    console.error("broker checkAuth:", err);
    return res.status(500).json({ serverSuccess: false });
  }
};

exports.updateFCM = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken || typeof fcmToken !== "string") {
      return res.status(400).json({ message: "fcmToken is required." });
    }

    await UserModel.updateOne(
      { _id: req.userId },
      { $addToSet: { FCMtokens: fcmToken.trim() } },
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "broker updateFCM");
  }
};
