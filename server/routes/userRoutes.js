const  express  = require('express');
const router = express.Router();
const UserController =  require('../controllers/userController');
const checkUserAuth = require('../middlewares/auth-middleware');


// Public Routes
router.post('/register', UserController.userRegistration)
router.post('/login', UserController.userLogin)
router.post('/forgotPassword', UserController.forgotPassword)
router.post('/resetPassword', UserController.userPasswordReset)
// Protected Routes
router.get('/verify/:id/:token',checkUserAuth,UserController.verifyUser)
router.post('/changepassword',checkUserAuth, UserController.changeUserPassword)
router.get('/getUserProfile',checkUserAuth, UserController.getUserProfile)
router.post('/sendOTP',checkUserAuth,UserController.sendOTP)
router.post('/verifyOTP',checkUserAuth,UserController.verifyOTP)


module.exports = router;