const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const JWT_SECRET = process.env.JWT_SECRET;
require("dotenv").config();
const PasswordResetModel = require("../Models/PasswordResetModel");
const { UserModel } = require("../Models/UserModel");
const sgMail = require("@sendgrid/mail");

exports.sendPassResetMail = async (req, res) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const Data = req.body;
    // console.log(Data);
    if (!Data?.email?.length > 0) {
      res.status(403).json({ message: "Email is required" });
      return;
    }
    const user = await UserModel.findOne({ email: Data.email });
    if (!user) return res.status(403).json({ message: "Invalid credential" });

    const reset = await PasswordResetModel.create({
      user: user._id,
      userModel: user.uuid ? "googleUser" : "users",
    });
    const token = jwt.sign(
      { email: Data.email, _id: reset._id }, // payload should be an object
      JWT_SECRET, // your secret key
      { expiresIn: "15m" } // set expiration time
    );
    if (!reset)
      return res.status(403).json({ message: "Something went wrong." });

    const resetURL = `${process.env.FRONTEND2}/forgot-password/${token}`;

    const mail = {
      from: "PMS <propertymanagementsystem.pms@gmail.com>",
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
    await sgMail.send(mail).then(() => {
      console.log("Email sent");
      return res
        .status(200)
        .json({ message: "Email sent. Token Expiration Time: 15 mins" });
    });
  } catch (err) {
    console.log(err);
    console.log(err.response.body.errors);
    return res.status(403).json({ message: "Something went wrong." });
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

exports.verifyToken = async (req, res) => {
  try {
    const Data = req.body;
    // console.log(Data);
    if (!Data) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }
    const verify = jwt.verify(Data.token, JWT_SECRET);
    if (verify) {
      const check = await PasswordResetModel.findOne({ _id: verify._id });
      if (!check) return res.status(403).json({ message: "Invalid token" });
      res.status(200).json({
        success: true,
      });
    } else {
      res.status(403).json({
        success: false,
      });
    }
  } catch (err) {
    console.log(err.message);
    if (err.message === "jwt expired") {
      return res.status(403).json({
        success: false,
      });
    }
    res.status(403).json({ message: "Something went wrong." });
  }
};
