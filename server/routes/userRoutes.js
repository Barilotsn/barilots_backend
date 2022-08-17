const  express  = require('express');
const router = express.Router();
const UserController =  require('../controllers/userController');
const checkUserAuth = require('../middlewares/auth-middleware');


// Public Routes
router.post('/register', UserController.userRegistration)
router.post('/login', UserController.userLogin)

// Protected Routes
router.post('/send-reset-password-email',checkUserAuth, UserController.sendUserPasswordResetEmail)
router.post('/reset-password/:id/:token',checkUserAuth, UserController.userPasswordReset)
router.post('/changepassword',checkUserAuth, UserController.changeUserPassword)
router.get('/loggeduser',checkUserAuth, UserController.loggedUser)


module.exports = router;