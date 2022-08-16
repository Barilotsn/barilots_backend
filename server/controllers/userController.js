import UserModel from '../models/User.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from '../config/emailConfig.js'
const lang = require("../config/language.json");
class UserController {
  static userRegistration = async (req, res) => {
    const { name, email, password, password_confirmation, tc } = req.body
    const user = await UserModel.findOne({ email: email })
    if (user) {
      res.send({ status: false, msg: lang[process.env.lang].emailExist })
    } else {
      if (name && email && password && password_confirmation && tc) {
        if (password === password_confirmation) {
          try {
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(password, salt)
            const doc = new UserModel({
              name: name,
              email: email,
              password: hashPassword,
              tc: tc
            })
            await doc.save()
            const saved_user = await UserModel.findOne({ email: email })
            // Generate JWT Token
            const token = jwt.sign({ userID: saved_user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '5d' })
            res.status(200).send({ status: true, msg: lang[process.env.lang].successSignup, token: token })
          } catch (error) {
            console.log(error)
            res.status(200).send({ status: false, msg: lang[process.env.lang].failureInsert})
          }
        } else {
          res.status(200).send({ status: false, msg: lang[process.env.lang].confirmPasswordNotMatch})
        }
      } else {
        res.status(200).send({ status: false, msg: lang[process.env.lang].required })
      }
    }
  }

  static userLogin = async (req, res) => {
    try {
      const { email, password } = req.body
      if (email && password) {
        const user = await UserModel.findOne({ email: email })
        if (user != null) {
          const isMatch = await bcrypt.compare(password, user.password)
          if ((user.email === email) && isMatch) {
            // Generate JWT Token
            const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '5d' })
            res.status(200).send({ "status": true, "msg": "Login Success", "token": token })
          } else {
            res.status(200).send({ "status": false, "msg": "Email or Password is not Valid" })
          }
        } else {
          res.status(200).send({ "status": false, "msg": "You are not a Registered User" })
        }
      } else {
        res.status(200).send({ "status": false, "msg": "All Fields are Required" })
      }
    } catch (error) {
      console.log(error)
      res.status(200).send({ "status": false, "msg": "Unable to Login" })
    }
  }

  static changeUserPassword = async (req, res) => {
    const { password, password_confirmation } = req.body
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.status(200).send({ "status": false, "msg": "New Password and Confirm New Password doesn't match" })
      } else {
        const salt = await bcrypt.genSalt(10)
        const newHashPassword = await bcrypt.hash(password, salt)
        await UserModel.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } })
        res.status(200).send({ "status": true, "msg": "Password changed succesfully" })
      }
    } else {
      res.status(200).send({ "status": false, "msg": "All Fields are Required" })
    }
  }

  static loggedUser = async (req, res) => {
    res.status(200).send({ "user": req.user })
  }

  static sendUserPasswordResetEmail = async (req, res) => {
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
        res.status(200).send({ "status": true, "msg": "Password Reset Email Sent... Please Check Your Email" })
      } else {
        res.status(200).send({ "status":false, "msg": "Email doesn't exists" })
      }
    } else {
      res.status(200).send({ "status": false, "msg": "Email Field is Required" })
    }
  }

  static userPasswordReset = async (req, res) => {
    const { password, password_confirmation } = req.body
    const { id, token } = req.params
    const user = await UserModel.findById(id)
    const new_secret = user._id + process.env.JWT_SECRET_KEY
    try {
      jwt.verify(token, new_secret)
      if (password && password_confirmation) {
        if (password !== password_confirmation) {
          res.status(200).send({ "status": false, "msg": "New Password and Confirm New Password doesn't match" })
        } else {
          const salt = await bcrypt.genSalt(10)
          const newHashPassword = await bcrypt.hash(password, salt)
          await UserModel.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } })
          res.status(200).send({ "status": true, "msg": "Password Reset Successfully" })
        }
      } else {
        res.status(200).send({ "status": false, "msg": "All Fields are Required" })
      }
    } catch (error) {
      console.log(error)
      res.status(200).send({ "status": false, "msg": "Invalid Token" })
    }
  }
}

export default UserController