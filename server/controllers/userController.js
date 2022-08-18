const mongoose = require("mongoose");
const UserModel = mongoose.model("User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendMail = require("../config/emailConfig");
const lang = require("../config/language.json");
const rn = require("random-number");
const DateDiff = require('date-diff');
const gen = rn.generator({
  min: 10000,
  max: 100000,
  integer: true,
});

module.exports.userRegistration = async (req, res, next) => {
  console.log("Inside userRegistration fn. on UserController.js");
  const {
    first_name,
    last_name,
    email,
    phoneno,
    password,
    password_confirmation,
    tc,
  } = req.body;

  if (password === password_confirmation) {
    try {
      const user = new UserModel();
      user.first_name = first_name;
      user.last_name = last_name;
      user.email = email.toLowerCase();
      user.otp = temp;
      user.phoneno = phoneno;
      user.isverified = false;
      user.password = password;
      user.setPassword = true;
      user.tc = tc;
      const saved_user = await user.save();
      const jwt_token = jwt.sign(
        { _id: saved_user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "5d" }
      );
      //pushJwtToken(saveduser._id,jwt_token);
      const link = `${process.env.HOST}:${process.env.PORT}/api/user/verify/${saved_user._id}/${jwt_token}`;
      console.log(link);
      // Send Email
      const mailOptions = {
        to: saved_user.email,
        subject: "Registration Varification",
        value: link,
        msg: "Your OTP is",
      };
      //sendMail.SendEmail(mailOptions);
      res
        .status(200)
        .send({
          status: true,
          msg: lang[process.env.lang].successSignup,
          token: jwt_token,
        });
    } catch (error) {
      if (error.code == 11000) {
        if (error.errmsg.includes("phoneno")) {
          res
            .status(200)
            .send({ status: false, msg: "Phone no. already exists." });
        } else {
          res
            .status(200)
            .send({ status: false, msg: "Email id already exists." });
        }
      } else {
        next(error);
      }
    }
  } else {
    res
      .status(200)
      .send({
        status: false,
        msg: lang[process.env.lang].confirmPasswordNotMatch,
      });
  }
};

module.exports.userLogin = async (req, res, next) => {
  console.log("Inside userLogin fn. on UserController.js");
  try {
    const { email, password } = req.body;
    if (email && password) {
      const user = await UserModel.findOne({ email: email });
      if (user != null) {
        if (!user.isverified) {
          res
            .status(200)
            .send({ status: false, msg: lang[process.env.lang].notVerified });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (user.email === email && isMatch) {
          // Generate JWT Token
          const token = jwt.sign(
            { userID: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "5d" }
          );
          res
            .status(200)
            .send({
              status: true,
              msg: lang[process.env.lang].successSignin,
              token: token,
            });
        } else {
          res
            .status(200)
            .send({
              status: false,
              msg: lang[process.env.lang].passwordNotmatch,
            });
        }
      } else {
        res
          .status(200)
          .send({ status: false, msg: lang[process.env.lang].userNotFound });
      }
    } else {
      res
        .status(200)
        .send({ status: false, msg: lang[process.env.lang].required });
    }
  } catch (error) {
    console.log(error);
    res.status(200).send({ status: false, msg: "Unable to Login" });
  }
};

module.exports.verifyUser = async (req, res) => {
  console.log("Inside verifyUser fn. on UserController.js");
  const { id, token } = req.params;
  const user = await UserModel.findById(id);
  try {
    await UserModel.findByIdAndUpdate(user._id, { $set: { isverified: true } });
    res.status(200).send({ status: true, msg: "User Verified!" });
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .send({ status: false, msg: lang[process.env.lang].userNotFound });
  }
};

module.exports.changeUserPassword = async (req, res) => {
  console.log("Inside changeUserPassword fn. on UserController.js");
  const { password, password_confirmation } = req.body;
  if (password && password_confirmation) {
    if (password !== password_confirmation) {
      res
        .status(200)
        .send({
          status: false,
          msg: lang[process.env.lang].confirmPasswordNotMatch,
        });
    } else {
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);
      await UserModel.findByIdAndUpdate(req.user._id, {
        $set: { password: newHashPassword },
      });
      res
        .status(200)
        .send({
          status: true,
          msg: lang[process.env.lang].passwordChangeSuccess,
        });
    }
  } else {
    res
      .status(200)
      .send({ status: false, msg: lang[process.env.lang].required });
  }
};

module.exports.getUserProfile = async (req, res) => {
  res.status(200).send({ user: req.user });
};

module.exports.forgotPassword = async (req, res) => {
  console.log("Inside forgotPassword fn. on UserController.js");
  const { email } = req.body;
  if (email) {
    const user = await UserModel.findOne({ email: email });
    if (user) {
      const secret = user._id + process.env.JWT_SECRET_KEY;
      const token = jwt.sign({ userID: user._id }, secret, {
        expiresIn: "15m",
      });
      const link = `${process.env.HOST}:${process.env.PORT}/api/user/reset/${user._id}`;
      console.log(link);
      // // Send Email
      // let info = await transporter.sendMail({
      //   from: process.env.EMAIL_FROM,
      //   to: user.email,
      //   subject: "GeekShop - Password Reset Link",
      //   html: `<a href=${link}>Click Here</a> to Reset Your Password`
      // })
      res
        .status(200)
        .send({
          status: true,
          msg: lang[process.env.lang].forgotPasswordLink,
          link: link,
        });
    } else {
      res
        .status(200)
        .send({ status: false, msg: lang[process.env.lang].emailNotExist });
    }
  } else {
    res
      .status(200)
      .send({ status: false, msg: lang[process.env.lang].emptyEmail });
  }
};

module.exports.userPasswordReset = async (req, res) => {
  console.log("Inside userPasswordReset fn. on UserController.js");
  const { id, password, password_confirmation } = req.body;
  const user = await UserModel.findById(id);
  try {
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res
          .status(200)
          .send({
            status: false,
            msg: lang[process.env.lang].confirmPasswordNotMatch,
          });
      } else {
        const salt = await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(password, salt);
        await UserModel.findByIdAndUpdate(user._id, {
          $set: { password: newHashPassword },
        });
        res
          .status(200)
          .send({ status: true, msg: "Password Reset Successfully" });
      }
    } else {
      res
        .status(200)
        .send({ status: false, msg: lang[process.env.lang].required });
    }
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .send({ status: false, msg: lang[process.env.lang].userNotFound });
  }
};

module.exports.sendOTP = async (req, res) => {
  console.log("Inside sendOTP fn. on UserController.js");
  const { phoneno } = req.body;
  const user = await UserModel.findById(req.user._id);
  try {
    const randomOTP = gen();
    const temp = {};
    temp.otp_value = randomOTP;
    temp.otp_createdOn = new Date();
    user.otp = temp;
    user.phoneno = phoneno;
    await user.save();
    // Send Email
    const mailOptions = {
      to: user.email,
      subject: "One Time Password",
      value: randomOTP,
      msg: "This is your OTP for Bailots Two Step Verification!",
    };
    //sendMail.SendEmail(mailOptions);
    res
      .status(200)
      .send({
        status: true,
        otp: randomOTP,
        msg: lang[process.env.lang].otpEmail,
      });
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .send({ status: false, msg: lang[process.env.lang].userNotFound });
  }
};

module.exports.verifyOTP = async (req, res) => {
  console.log("Inside Verify OTP fn. on UserController.js");
  if (req.body.otp != "") {
    const UserEmail = req.body.email.toLowerCase();
    const user = await UserModel.findOne(
      { is_deleted: 0, email: UserEmail },
      { otp: 1 }
    );
    try {
      const otp = Object.values(user.otp);
      const currentdate = new Date();
      const otp_createdOn = otp[0].otp_createdOn;
      const diffhours = new DateDiff(currentdate, otp_createdOn);
      if (
        Math.round(diffhours.hours()) <= 3 &&
        otp[0].otp_value == req.body.otp
      ) {
        user.isverified = true;
        const updateUser = await user.save();
        if (updateUser) {
          return res
            .status(200)
            .send({ status: true, msg: lang[process.env.lang].otpVerified });
        }
      } else {
        return res
          .status(200)
          .send({ status: false, message: lang[process.env.lang].expiredOTP });
      }
    } catch (error) {
      console.log(error);
      res
        .status(200)
        .send({ status: false, msg: lang[process.env.lang].userNotFound });
    }
  } else {
    return res
      .status(200)
      .json({ status: false, msg: lang[process.env.lang].required });
  }
};
pushJwtToken = async (id, token) => {
  await UserModel.updateOne(
    { _id: id },
    { $push: { jwt_tokens: { token: token, expire: false } } }
  );
};
