const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserModel, GoogleUserModel } = require("../Models/UserModel");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");
const JWT_SECRET = process.env.JWT_SECRET;

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    let existingUser;
    existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    } else {
      existingUser = await GoogleUserModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "User already exists." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      email,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        email: newUser.email,
        username: newUser.username,
        _id: newUser._id,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// SIGNIN
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Signed in successfully.",
      token,
      user: {
        email: user.email,
        username: user.username,
        _id: user._id,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.signinWithGoogle = async (req, res) => {
  try {
    const { email, uuid, username, pp } = req.body;
    // console.log(FCMtoken, device);
    const existingUser = await GoogleUserModel.findOne({ uuid });
    if (existingUser) {
      const existingUserToken = jwt.sign(
        { id: existingUser._id, type: "google" },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.status(201).json({
        message: "User signedin successfully.",
        token: existingUserToken,
        user: existingUser,
      });
    } else {
      const newUser = new GoogleUserModel({
        email,
        uuid,
        username,
        pp,
      });

      await newUser.save();
      const newUserToken = jwt.sign(
        { id: newUser._id, type: "google" },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
      //   const transporter = nodemailer.createTransport({
      //     service: "gmail",
      //     host: "smtp.ethereal.email",
      //     port: 587,
      //     secure: false,
      //     auth: {
      //       user: process.env.EMAIL_USER,
      //       pass: process.env.EMAIL_PASSWORD,
      //     },
      //   });
      //   const mailOptions = {
      //     from: process.env.EMAIL_USER,
      //     to: email,
      //     subject: "Password Reset Request",
      //     html: `
      //            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
      //   <div>
      //     <h2 style="color: #333; font-size: 28px; font-weight: bold;">Reset Your Password</h2>
      //   </div>
      //   <p>Hello,</p>
      //   <p>We received a request to reset your password. Click the button below to proceed:</p>
      //   <div style="margin: 30px 0;">
      //     <a

      //     style = "background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 16px; font-weight: bold;"
      //     href="${resetURL}"
      //         >
      //         Reset Password
      //     </a >
      //   </div >
      //   <p>If you didn't request this, you can safely ignore this email.</p>
      //   <p>This link will expire in 15 minutes.</p>
      //   <hr style="border: 1px solid #eee; margin: 20px 0;" />
      //   <p style="color: #666; font-size: 12px;">
      //     This is an automated message. Please do not reply.
      //   </p>
      // </div >
      // `,
      //   };
      //   // Send email
      //   await transporter.sendMail(mailOptions);
      res.status(201).json({
        message: "User registered successfully.",
        token: newUserToken,
        user: newUser,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.editProfile = async (req, res) => {
  try {
    const Data = req.body;
    console.log(Data);
    if (!Data && !Data.token) {
      res.status(403).json({ message: "Something went wrong." });
      return;
    }
    const verify = jwt.verify(Data.token, process.env.JWT_SECRET);

    console.log(Data, verify);
    if (Data.currentPassword && verify.type !== "google") {
      const user = await UserModel.findOne({ _id: verify.id });
      if (user) {
        const result = await bcrypt.compare(
          Data.currentPassword,
          user.password
        );
        if (result) {
          const hashedPassword = await bcrypt.hash(Data.newPassword, 10);
          await UserModel.findOneAndUpdate(
            { _id: verify.id },
            {
              password: hashedPassword,
            }
          );
          res.status(200).json({ success: true });
        } else {
          res.status(403).json({ message: "Current password is invalid" });
        }
      }
      return;
    }
    let updateUser;
    if (verify.type === "google") {
      updateUser = await GoogleUserModel.findOneAndUpdate(
        { _id: Data._id },
        {
          username: Data.username,
          phone: Data.phone,
        },
        { new: true }
      ).select("-password");
    } else {
      updateUser = await UserModel.findOneAndUpdate(
        { _id: Data._id },
        {
          username: Data.username,
          phone: Data.phone,
        },
        { new: true }
      ).select("-password");
    }
    // console.log(updateUser);
    if (updateUser) {
      res.status(200).json({ user: updateUser, success: true });
    } else {
      res.status(403).json({ message: "Something went wrong user." });
    }
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Something went wrong." });
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
    let findUser;
    if (decoded?.type === "google") {
      findUser = await GoogleUserModel.findOne({ _id: decoded.id }).select(
        "-password -bookedProperties"
      );
    } else {
      findUser = await UserModel.findOne({ _id: decoded.id }).select(
        "-password -bookedProperties -myProperties"
      );
    }

    if (findUser) {
      res.status(200).json({
        success: true,
        token,
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
    // console.log(fcmToken, device, token);
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decode);
    if (decode.type === "google") {
      await GoogleUserModel.findOneAndUpdate(
        { _id: decode.id },
        {
          $push: {
            FCMtokens: [fcmToken],
          },
        }
      ).then(() => {
        res.json({ success: true });
      });
    } else {
      await UserModel.findOneAndUpdate(
        { _id: decode.id },
        {
          $push: {
            FCMtokens: [fcmToken],
          },
        }
      ).then(() => {
        res.json({ success: true });
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
