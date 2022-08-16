import express from 'express';
const router = express.Router();
import UserController from '../controllers/userController.js';
import checkUserAuth from '../middlewares/auth-middleware.js';


// Public Routes
router.post('/register',checkUserAuth, UserController.userRegistration)
router.post('/login',checkUserAuth, UserController.userLogin)
router.post('/send-reset-password-email',checkUserAuth, UserController.sendUserPasswordResetEmail)
router.post('/reset-password/:id/:token',checkUserAuth, UserController.userPasswordReset)

// Protected Routes
router.post('/changepassword',checkUserAuth, UserController.changeUserPassword)
router.get('/loggeduser',checkUserAuth, UserController.loggedUser)


export default router