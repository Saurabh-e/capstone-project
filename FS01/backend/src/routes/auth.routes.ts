import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post(
  '/register',
  authLimiter,
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authValidation.login),
  authController.login
);

router.post(
  '/refresh',
  validate(authValidation.refresh),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword
);

router.post('/logout', authController.logout);

export default router;
