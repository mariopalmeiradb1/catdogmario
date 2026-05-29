import { Request, Response, NextFunction } from 'express';
import { env } from '~/config/env';
import { HttpStatus } from '~/shared/constants/http-status';
import { authService } from './auth.service';
import { authRepository } from './auth.repository';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  async registerAdopter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerAdopter(req.body);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  async registerOng(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerOng(req.body);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.status(HttpStatus.OK).json({
        access_token: result.access_token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.confirmEmail(req.body.token);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resendConfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resendConfirmation(req.body.email);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyResetCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.verifyResetCode(req.body.email, req.body.code);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body.reset_token, req.body.password);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenValue = req.cookies?.refresh_token;
      if (!refreshTokenValue) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: { code: 'UNAUTHORIZED', message: 'Token inválido ou ausente.' },
        });
        return;
      }

      const result = await authService.refreshToken(refreshTokenValue);
      res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.status(HttpStatus.OK).json({
        access_token: result.access_token,
        user: result.user,
      });
    } catch (error) {
      res.clearCookie('refresh_token', { path: '/api/v1/auth' });
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenValue = req.cookies?.refresh_token;
      if (refreshTokenValue) {
        await authService.logout(refreshTokenValue);
      }
      res.clearCookie('refresh_token', { path: '/api/v1/auth' });
      res.status(HttpStatus.OK).json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authRepository.findUserById(req.user!.userId);
      if (!user) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: { code: 'UNAUTHORIZED', message: 'Token inválido ou ausente.' },
        });
        return;
      }
      res.status(HttpStatus.OK).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ong_id: user.ong_id,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
