const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const  UserModel  = require("../Models/UserModel");
const PasswordResetModel = require("../Models/PasswordResetModel");
const sgMail = require("@sendgrid/mail");
const JWT_SECRET = process.env.JWT_SECRET;

exports.sendPassResetMail = async (req, res) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const { email } = req.body;
    if (!email || !email.length)
      return res.status(400).json({ message: "Email is required" });

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // create reset document
    const reset = await PasswordResetModel.create({
      user: user._id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    const token = jwt.sign({ _id: reset._id }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetURL = `${process.env.FRONTEND2}/forgot-password/${token}`;

    await sgMail.send({
      from: "PMS <propertymanagementsystem.pms@gmail.com>",
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetURL}">here</a> to reset your password. Expires in 15 mins.</p>`,
    });

    res.status(200).json({ message: "Email sent. Token expiration: 15 mins" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const resetDoc = await PasswordResetModel.findById(decoded._id);
    if (!resetDoc)
      return res.status(403).json({ message: "Invalid or expired token" });

    res.status(200).json({ success: true });
  } catch (err) {
    if (err.message === "jwt expired")
      return res.status(403).json({ message: "Token expired" });
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.verifyCreds = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: "Invalid request" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const resetDoc = await PasswordResetModel.findById(decoded._id);
    if (!resetDoc)
      return res.status(403).json({ message: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(resetDoc.user, {
      password: hashedPassword,
    });

    // delete the reset document after use
    await PasswordResetModel.findByIdAndDelete(resetDoc._id);

    res.status(200).json({ success: true });
  } catch (err) {
    if (err.message === "jwt expired")
      return res.status(403).json({ message: "Token expired" });
    res.status(500).json({ message: "Something went wrong" });
  }
};
