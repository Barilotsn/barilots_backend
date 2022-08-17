const mongoose= require('mongoose');
const UserModel = mongoose.model('User');
//const UserModel = require('../models/User.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendMail = require('../config/emailConfig');
const lang = require('../config/language.json');
const rn = require('random-number');
const  gen = rn.generator({
  min:  10000,
  max:  100000,
  integer: true
})

module.exports.userRegistration = async (req, res, next) => {
    const { first_name,last_name,email,phoneno,password, password_confirmation, tc } = req.body
    const randomOTP= gen();
    const temp = {};
    temp.otp_value = randomOTP;
    temp.otp_createdOn = new Date();
        if (password === password_confirmation) {
          try {
            const randomOTP= gen();
            const user = new UserModel();
            const temp = {};
            temp.otp_value = randomOTP;
            temp.otp_createdOn = new Date();
            user.first_name=first_name;
            user.last_name= last_name;
            user.email = email.toLowerCase();
            user.otp=temp;
            user.phoneno= phoneno;
            user.isverified=false;
            user.password= password;
            user.setPassword = true;
            user.tc = tc;
            const saved_user = await user.save();
            const jwt_token = jwt.sign({_id:saved_user._id,userType:saved_user.type},process.env.JWT_SECRET_KEY,{expiresIn:'5d'})
            //pushJwtToken(saveduser._id,jwt_token);
            const link = `http://127.0.0.1:3000/api/verify/${saved_user._id}/${jwt_token}`
            // Send Email
            const mailOptions = {
              to: saved_user.email,
              subject: 'Registration Varification',
              value: link,
              msg:'Your OTP is'
          };
          //sendMail.SendEmail(mailOptions);
            res.status(200).send({ status: true, msg: lang[process.env.lang].successSignup, token: jwt_token })
          } catch (error) {
            if(error.code == 11000)
                {
                    if(error.errmsg.includes('phoneno'))
                    {
                         res.status(200).send({status:false,msg:'Phone no. already exists.'});
                    }
                    else
                    {
                         res.status(200).send({status:false,msg:'Email id already exists.'});
                    }
                }
                else
                {
                     next(error);
                }
          }
        } else {
          res.status(200).send({ status: false, msg: lang[process.env.lang].confirmPasswordNotMatch})
        }
      
  }

  module.exports.userLogin = async (req, res, next) => {
    try {
      const { email, password } = req.body
      if (email && password) {
        const user = await UserModel.findOne({ email: email })
        if (user != null) {
          const isMatch = await bcrypt.compare(password, user.password)
          if ((user.email === email) && isMatch) {
            // Generate JWT Token
            const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '5d' })
            res.status(200).send({ status: true, msg: lang[process.env.lang].successSignin, token: token })
          } else {
            res.status(200).send({ status: false, msg: lang[process.env.lang].passwordNotmatch })
          }
        } else {
          res.status(200).send({ status: false, msg: lang[process.env.lang].userNotFound })
        }
      } else {
        res.status(200).send({ status: false, msg: lang[process.env.lang].required })
      }
    } catch (error) {
      console.log(error)
      res.status(200).send({ status: false, msg: "Unable to Login" })
    }
  }

  module.exports.changeUserPassword = async (req, res) => {
    const { password, password_confirmation } = req.body
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.status(200).send({ status: false, msg: "New Password and Confirm New Password doesn't match" })
      } else {
        const salt = await bcrypt.genSalt(10)
        const newHashPassword = await bcrypt.hash(password, salt)
        await UserModel.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } })
        res.status(200).send({ status: true, msg: lang[process.env.lang].passwordChangeSuccess })
      }
    } else {
      res.status(200).send({ status: false, msg: lang[process.env.lang].required })
    }
  }

  module.exports.loggedUser = async (req, res) => {
    res.status(200).send({ "user": req.user })
  }

  module.exports.sendUserPasswordResetEmail = async (req, res) => {
    const { email } = req.body
    if (email) {
      const user = await UserModel.findOne({ email: email })
      if (user) {
        const secret = user._id + process.env.JWT_SECRET_KEY
        const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '15m' })
        const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`
        console.log(link)
        // // Send Email
        // let info = await transporter.sendMail({
        //   from: process.env.EMAIL_FROM,
        //   to: user.email,
        //   subject: "GeekShop - Password Reset Link",
        //   html: `<a href=${link}>Click Here</a> to Reset Your Password`
        // })
        res.status(200).send({ status: true, msg: "Password Reset Email Sent... Please Check Your Email" })
      } else {
        res.status(200).send({ status:false, msg: "Email doesn't exists" })
      }
    } else {
      res.status(200).send({ status: false, msg: "Email Field is Required" })
    }
  }

  module.exports.userPasswordReset = async (req, res) => {
    const { password, password_confirmation } = req.body
    const { id, token } = req.params
    const user = await UserModel.findById(id)
    const new_secret = user._id + process.env.JWT_SECRET_KEY
    try {
      jwt.verify(token, new_secret)
      if (password && password_confirmation) {
        if (password !== password_confirmation) {
          res.status(200).send({ status: false, msg: "New Password and Confirm New Password doesn't match" })
        } else {
          const salt = await bcrypt.genSalt(10)
          const newHashPassword = await bcrypt.hash(password, salt)
          await UserModel.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } })
          res.status(200).send({ status: true, msg: "Password Reset Successfully" })
        }
      } else {
        res.status(200).send({ status: false, msg: "All Fields are Required" })
      }
    } catch (error) {
      console.log(error)
      res.status(200).send({ status: false, msg: "Invalid Token" })
    }
  }

  pushJwtToken = async(id,token)=> {
    await UserModel.updateOne({ _id : id },{ $push: { "jwt_tokens" : {token:token,expire:false} } });
}
