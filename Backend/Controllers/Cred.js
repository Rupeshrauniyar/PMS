const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserModel = require("../Models/UserModel");
const PasswordResetModel = require("../Models/PasswordResetModel");
const sgMail = require("@sendgrid/mail");
const {
  JWT_SECRET,
  BCRYPT_ROUNDS,
  normalizeEmail,
  isValidEmail,
  sendServerError,
} = require("../utils/authHelpers");

const MIN_PASSWORD_LEN = 8;

exports.sendPassResetMail = async (req, res) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY is not set.");
      return res.status(503).json({ message: "Email service is unavailable." });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const emailRaw = req.body?.email;
    const email = normalizeEmail(emailRaw);

    if (!email?.length) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const user = await UserModel.findOne({ email }).select("_id email");

    const genericOk = () =>
      res.status(200).json({
        message:
          "If an account exists for that email, you will receive reset instructions shortly.",
      });

    if (!user) {
      return genericOk();
    }

    const reset = await PasswordResetModel.create({
      user: user._id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const token = jwt.sign({ _id: reset._id }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetURL = `${process.env.FRONTEND2}/forgot-password/${token}`;

    await sgMail.send({
      from: "PMS <propertymanagementsystem.pms@gmail.com>",
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetURL}">here</a> to reset your password. Expires in 15 mins.</p>`,
    });

    return genericOk();
  } catch (err) {
    const detail = err?.response?.body;
    if (detail) console.error("sendPassResetMail:", detail);
    else console.error("sendPassResetMail:", err?.message || err);
    return sendServerError(res, err, "sendPassResetMail");
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const resetDoc = await PasswordResetModel.findById(decoded._id)
      .select("_id expiresAt")
      .lean();

    if (!resetDoc) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    if (resetDoc.expiresAt && new Date(resetDoc.expiresAt) < new Date()) {
      await PasswordResetModel.deleteOne({ _id: resetDoc._id });
      return res.status(403).json({ message: "Token expired" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.message === "jwt expired") {
      return res.status(403).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token" });
    }
    return sendServerError(res, err, "verifyToken");
  }
};

exports.verifyCreds = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }
    if (String(newPassword).length < MIN_PASSWORD_LEN) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const resetDoc = await PasswordResetModel.findById(decoded._id).lean();

    if (!resetDoc) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    if (resetDoc.expiresAt && new Date(resetDoc.expiresAt) < new Date()) {
      await PasswordResetModel.deleteOne({ _id: resetDoc._id });
      return res.status(403).json({ message: "Token expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await UserModel.updateOne(
      { _id: resetDoc.user },
      { password: hashedPassword },
    );

    await PasswordResetModel.deleteOne({ _id: resetDoc._id });

    return res.status(200).json({ success: true });
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.message === "jwt expired") {
      return res.status(403).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token" });
    }
    return sendServerError(res, err, "verifyCreds");
  }
};
