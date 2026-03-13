import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router: Router = Router();
const authController = new AuthController();

// Login route
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.login);

// Register route
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('role').isIn(['CUSTOMER', 'ADMIN', 'STAFF']).withMessage('Invalid role')
], authController.register);

// Admin login route with server-side role verification
router.post('/admin/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.adminLogin);

// Logout route (requires authentication)
router.post('/logout', authenticate, [
  body('token').notEmpty().withMessage('Token is required')
], authController.logout);

// Send phone verification code
router.post('/send-verify-code', [
  body('phone').notEmpty().withMessage('Phone number is required')
], authController.sendVerifyCode);

// Verify phone code
router.post('/verify-code', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('code').notEmpty().withMessage('Verification code is required')
], authController.verifyCode);

// Get current user (requires authentication)
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
