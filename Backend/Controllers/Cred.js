const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const JWT_SECRET = process.env.JWT_SECRET;
require("dotenv").config();
const PasswordResetModel = require("../Models/PasswordResetModel");
const {UserModel} = require("../Models/UserModel");
exports.sendPassResetMail = async (req, res) => {
  try {
    const Data = req.body;
    // console.log(Data);
    if (!Data?.email?.length > 0) {
      res.status(403).json({ message: "Email is required" });
      return;
    }
    const user = await UserModel.findOne({ email: Data.email });
    if (!user) return res.status(403).json({ message: "Invalid credential" });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.PASSWORD_USER,
      },
    });

    const token = jwt.sign(
      { email: Data.email }, // payload should be an object
      JWT_SECRET, // your secret key
      { expiresIn: "15m" } // set expiration time
    );

    const resetURL = `${process.env.FRONTEND2}/forgot-password/${token}`;

    const mailOptions = {
      from: "PMS",
      to: Data.email,
      subject: "Password Reset Request",
      html: `
               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
      <div>
        <h2 style="color: #333; font-size: 28px; font-weight: bold;">Reset Your Password</h2>
      </div>
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <div style="margin: 30px 0;">
        <a
          
        style = "background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 16px; font-weight: bold;"
        href=${resetURL}
            >
            Reset Password
        </a >
      </div >
      <p>If you didn't request this, you can safely ignore this email.
      </p>
      <p>This link will expire in 15 minutes.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">
        This is an automated message. Please do not reply.
      </p>
    </div >
    `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.json({ message: "Token sent to yur Email, Token will be expired in 15MINS." });
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong." });
  }
};

exports.verifyCreds = async (req, res) => {
  try {
    const Data = req.body;
    // console.log(Data);
    if (!Data) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }
    const verify = jwt.verify(Data.token, JWT_SECRET);
    if (verify) {
      const hashedPassword = await bcrypt.hash(Data.newPassword, 10);
      await UserModel.findOneAndUpdate(
        { email: verify.email },
        {
          password: hashedPassword,
        }
      );
      res.status(200).json({ success: true });
    }
  } catch (err) {
    console.log(err.message);
    if (err.message === "jwt expired") {
      return res
        .status(403)
        .json({ message: "Token expired, Please send reset email again" });
    }
    res.status(403).json({ message: "Something went wrong." });
  }
};
