const bcrypt = require("bcryptjs");
const UserModel = require("../Models/UserModel");
const {
  BCRYPT_ROUNDS,
  normalizeEmail,
  isValidEmail,
  sendServerError,
  decodeAccessFromRequest,
  tryUserIdFromRefreshCookie,
  resolveGoogleIdentity,
  isValidObjectId,
} = require("../utils/authHelpers");
const {
  setSessionForUser,
  clearAuthCookies,
  rotateSessionFromPayload,
} = require("../utils/authCookies");

const MIN_PASSWORD_LEN = 8;

function sanitizeUser(user) {
  if (!user) return user;
  const o = user.toObject ? user.toObject() : { ...user };
  const { password, FCMtokens, notifications, ...safe } = o;
  return safe;
}

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const { password, username } = req.body;
    const email = normalizeEmail(rawEmail);

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
      password: hashedPassword,
      authProvider: "local",
    });

    const tokens = setSessionForUser(res, newUser, "user");

    return res.status(200).json({
      message: "User registered successfully.",
      user: sanitizeUser(newUser),
      ...tokens,
    });
  } catch (err) {
    return sendServerError(res, err, "signup");
  }
};

// SIGNIN (email + password)
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

    const tokens = setSessionForUser(res, user, "user");

    return res.status(200).json({
      message: "Signed in successfully.",
      user: sanitizeUser(user),
      ...tokens,
    });
  } catch (err) {
    return sendServerError(res, err, "signin");
  }
};

// SIGNIN WITH GOOGLE
exports.signinWithGoogle = async (req, res) => {
  try {
    const resolved = await resolveGoogleIdentity(req.body);
    const { email, uuid, username, pp } = resolved;
    if (!uuid || !email) {
      return res
        .status(400)
        .json({ message: "Email and Google id are required." });
    }

    const emailNorm = normalizeEmail(email);

    let user = await UserModel.findOne({
      uuid,
      authProvider: "google",
    }).populate({ path: "bookedProperties" });

    if (user) {
      if (pp && !user.pp) {
        user.pp = pp;
        await user.save();
      }
      const tokens = setSessionForUser(res, user, "user");
      return res.status(200).json({
        message: "Signed in successfully.",
        user: sanitizeUser(user),
        ...tokens,
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
      user = await UserModel.findByIdAndUpdate(
        existing._id,
        { $set: { uuid, ...(pp ? { pp } : {}) } },
        { new: true },
      ).populate({ path: "bookedProperties" });
      const tokens = setSessionForUser(res, user, "user");
      return res.status(200).json({
        message: "Signed in successfully.",
        user: sanitizeUser(user),
        ...tokens,
      });
    }

    const created = await UserModel.create({
      email: emailNorm,
      uuid,
      username,
      pp,
      authProvider: "google",
    });

    user = await UserModel.findById(created._id).populate({
      path: "bookedProperties",
    });

    const tokens = setSessionForUser(res, user, "user");

    return res.status(200).json({
      message: "Signed in successfully.",
      user: sanitizeUser(user),
      ...tokens,
    });
  } catch (err) {
    return sendServerError(res, err, "signinWithGoogle");
  }
};

exports.signout = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    const fromAccess = decodeAccessFromRequest(req, "user");
    const fromRefresh = tryUserIdFromRefreshCookie(req, "user");
    const uid = fromAccess?.id || fromRefresh?.id;

    clearAuthCookies(res, "user");

    if (fcmToken?.length > 0 && uid) {
      await UserModel.updateOne(
        { _id: uid },
        { $pull: { FCMtokens: fcmToken } },
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "signout");
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
    ).select("-password -FCMtokens -notifications");

    if (!updateUser) {
      return res.status(403).json({ message: "User not found." });
    }

    return res.status(200).json({ user: updateUser, success: true });
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
    let payload = decodeAccessFromRequest(req, "user");
    let findUser;
    let rotated = null;

    if (!payload) {
      const refreshPayload = tryUserIdFromRefreshCookie(req, "user");
      if (!refreshPayload?.id) {
        return res.status(401).json({ success: false });
      }

      findUser = await UserModel.findById(refreshPayload.id)
        .populate({ path: "bookedProperties" })
        .select("-password -FCMtokens -notifications");

      if (!findUser) {
        clearAuthCookies(res, "user");
        return res.status(401).json({ success: false });
      }

      rotated = rotateSessionFromPayload(res, refreshPayload, "user");
    } else {
      findUser = await UserModel.findById(payload.id)
        .populate({ path: "bookedProperties" })
        .select("-password -FCMtokens -notifications");

      if (!findUser) {
        clearAuthCookies(res, "user");
        return res.status(401).json({ success: false });
      }
    }

    return res.status(200).json({
      success: true,
      user: findUser,
      ...(rotated || {}),
    });
  } catch (err) {
    console.error("checkAuth:", err);
    return res.status(500).json({ serverSuccess: false });
  }
};

exports.refreshSession = async (req, res) => {
  try {
    const refreshPayload = tryUserIdFromRefreshCookie(req, "user");
    if (!refreshPayload?.id) {
      return res.status(401).json({ message: "Session expired." });
    }
    const exists = await UserModel.exists({ _id: refreshPayload.id });
    if (!exists) {
      clearAuthCookies(res, "user");
      return res.status(401).json({ message: "Account not found." });
    }
    const tokens = rotateSessionFromPayload(res, refreshPayload, "user");
    return res.status(200).json({ success: true, ...tokens });
  } catch (err) {
    return sendServerError(res, err, "refreshSession");
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const doc = await UserModel.findById(req.userId).select("notifications").lean();

    const list = [...(doc?.notifications ?? [])];
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = list.filter((n) => !n.read).length;

    return res.status(200).json({
      success: true,
      notifications: list,
      unreadCount,
    });
  } catch (err) {
    return sendServerError(res, err, "getNotifications");
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    if (!notificationId || !isValidObjectId(notificationId)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const r = await UserModel.updateOne(
      { _id: req.userId, "notifications._id": notificationId },
      { $set: { "notifications.$.read": true } },
    );

    if (!r.matchedCount) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "markNotificationRead");
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
    return sendServerError(res, err, "updateFCM");
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await UserModel.updateOne(
      { _id: req.userId },
      { $set: { "notifications.$[].read": true } },
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    return sendServerError(res, err, "markAllNotificationsRead");
  }
};
