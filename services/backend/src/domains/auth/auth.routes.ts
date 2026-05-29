import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authController } from './auth.controller';
import {
  registerAdopterSchema,
  registerOngSchema,
  loginSchema,
  confirmEmailSchema,
  resendConfirmationSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from './auth.validator';

const router = Router();

router.post(
  '/register/adopter',
  validate(registerAdopterSchema),
  (req, res, next) => authController.registerAdopter(req, res, next),
);

router.post(
  '/register/ong',
  validate(registerOngSchema),
  (req, res, next) => authController.registerOng(req, res, next),
);

router.post(
  '/login',
  validate(loginSchema),
  (req, res, next) => authController.login(req, res, next),
);

router.post(
  '/confirm-email',
  validate(confirmEmailSchema),
  (req, res, next) => authController.confirmEmail(req, res, next),
);

router.post(
  '/resend-confirmation',
  validate(resendConfirmationSchema),
  (req, res, next) => authController.resendConfirmation(req, res, next),
);

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next),
);

router.post(
  '/verify-reset-code',
  validate(verifyResetCodeSchema),
  (req, res, next) => authController.verifyResetCode(req, res, next),
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next),
);

router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

router.post('/logout', (req, res, next) => authController.logout(req, res, next));

router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export { router as authRoutes };
