const jwt = require('jsonwebtoken');
const mongoose= require('mongoose');
const UserModel = mongoose.model('User');

var checkUserAuth = async (req, res, next) => {
  let token
  const { authorization } = req.headers
  if (authorization && authorization.startsWith('Bearer')) {
    try {
      // Get Token from header
      token = authorization.split(' ')[1]

      // Verify Token
      const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY)

      // Get User from Token
      req.user = await UserModel.findById(userID).select('-password')

      next()
    } catch (error) {
      console.log(error)
      res.status(200).send({ status: false, msg: "Unauthorized User" })
    }
  }
  if (!token) {
    res.status(401).send({ status:false, msg: "Unauthorized User, No Token" })
  }
}

module.exports = checkUserAuth