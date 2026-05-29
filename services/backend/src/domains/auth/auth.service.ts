import { v4 as uuidv4 } from 'uuid';
import { env } from '~/config/env';
import { Roles } from '~/shared/constants/roles';
import { hashPassword, comparePassword } from '~/shared/utils/hash.util';
import { generateAccessToken, generateResetToken, verifyResetToken } from '~/shared/utils/token.util';
import { generateConfirmationToken, generateResetCode, hashToken } from '~/shared/utils/crypto.util';
import { addHours, addMinutes, addDays, isExpired } from '~/shared/utils/date.util';
import { mailService } from '~/shared/services/mail/mail.service';
import { buildConfirmationEmail, buildPasswordResetEmail } from '~/shared/services/mail/mail.templates';
import { authRepository } from './auth.repository';
import {
  RegisterAdopterInput,
  RegisterOngInput,
  LoginInput,
  LoginResult,
  RefreshResult,
} from './auth.types';
import {
  EmailAlreadyExistsError,
  CnpjAlreadyExistsError,
  InvalidCredentialsError,
  EmailNotConfirmedError,
  OngPendingApprovalError,
  TokenExpiredError,
  TokenAlreadyUsedError,
  InvalidCodeError,
  CodeExpiredError,
  AccountDeactivatedError,
} from './auth.errors';

export class AuthService {
  async registerAdopter(data: RegisterAdopterInput): Promise<{ message: string }> {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    const passwordHash = await hashPassword(data.password);
    const userId = uuidv4();

    await authRepository.createUser({
      id: userId,
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      role: Roles.ADOPTER,
      ong_id: null,
    });

    const token = generateConfirmationToken();
    const expiresAt = addHours(new Date(), 24);
    await authRepository.createEmailConfirmation({ userId, token, expiresAt });

    const confirmUrl = `${env.FRONTEND_URL}/confirm-email/${token}`;
    const html = buildConfirmationEmail(data.name, confirmUrl);
    await mailService.send({
      to: data.email,
      subject: 'Confirme seu e-mail - CatDog Mário',
      html,
    });

    return { message: 'Cadastro realizado! Verifique seu e-mail para ativar sua conta.' };
  }

  async registerOng(data: RegisterOngInput): Promise<{ message: string }> {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    const existingOng = await authRepository.findOngByCnpj(data.cnpj);
    if (existingOng) {
      throw new CnpjAlreadyExistsError();
    }

    const ongId = uuidv4();
    await authRepository.createOng({
      id: ongId,
      name: data.ong_name,
      cnpj: data.cnpj,
      phone: data.phone,
      address: data.address,
    });

    const passwordHash = await hashPassword(data.password);
    const userId = uuidv4();

    await authRepository.createUser({
      id: userId,
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      role: Roles.ONG_ADMIN,
      ong_id: ongId,
    });

    const token = generateConfirmationToken();
    const expiresAt = addHours(new Date(), 24);
    await authRepository.createEmailConfirmation({ userId, token, expiresAt });

    const confirmUrl = `${env.FRONTEND_URL}/confirm-email/${token}`;
    const html = buildConfirmationEmail(data.name, confirmUrl);
    await mailService.send({
      to: data.email,
      subject: 'Confirme seu e-mail - CatDog Mário',
      html,
    });

    return { message: 'Cadastro realizado! Verifique seu e-mail. Após a confirmação, sua ONG passará por aprovação.' };
  }

  async login(data: LoginInput): Promise<LoginResult> {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordValid = await comparePassword(data.password, user.password_hash);
    if (!passwordValid) {
      throw new InvalidCredentialsError();
    }

    if (!user.is_active) {
      throw new InvalidCredentialsError();
    }

    if (!user.email_confirmed_at) {
      throw new EmailNotConfirmedError();
    }

    if (user.role === Roles.ONG_ADMIN && user.ong_id) {
      const ong = await authRepository.findOngById(user.ong_id);
      if (ong && ong.status !== 'approved') {
        throw new OngPendingApprovalError();
      }
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      ongId: user.ong_id,
    });

    const refreshTokenRaw = generateConfirmationToken();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const refreshExpiresAt = addDays(new Date(), env.REFRESH_TOKEN_EXPIRY_DAYS);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      access_token: accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      refreshToken: refreshTokenRaw,
    };
  }

  async confirmEmail(token: string): Promise<{ message: string }> {
    const confirmation = await authRepository.findEmailConfirmationByToken(token);
    if (!confirmation) {
      throw new TokenExpiredError();
    }

    if (confirmation.used_at) {
      throw new TokenAlreadyUsedError();
    }

    if (isExpired(new Date(confirmation.expires_at))) {
      throw new TokenExpiredError();
    }

    await authRepository.markEmailConfirmationUsed(confirmation.id);
    await authRepository.confirmUserEmail(confirmation.user_id);

    return { message: 'E-mail confirmado com sucesso! Faça login para continuar.' };
  }

  async resendConfirmation(email: string): Promise<{ message: string }> {
    const user = await authRepository.findUserByEmail(email);

    if (user && !user.email_confirmed_at) {
      const token = generateConfirmationToken();
      const expiresAt = addHours(new Date(), 24);
      await authRepository.createEmailConfirmation({ userId: user.id, token, expiresAt });

      const confirmUrl = `${env.FRONTEND_URL}/confirm-email/${token}`;
      const html = buildConfirmationEmail(user.name, confirmUrl);
      await mailService.send({
        to: user.email,
        subject: 'Confirme seu e-mail - CatDog Mário',
        html,
      });
    }

    return { message: 'Se o e-mail estiver cadastrado, enviaremos um novo link de confirmação.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await authRepository.findUserByEmail(email);

    if (user) {
      const code = generateResetCode();
      const expiresAt = addMinutes(new Date(), 15);
      await authRepository.createPasswordReset({ userId: user.id, code, expiresAt });

      const html = buildPasswordResetEmail(user.name, code);
      await mailService.send({
        to: user.email,
        subject: 'Recuperação de Senha - CatDog Mário',
        html,
      });
    }

    return { message: 'Enviamos um código de 6 dígitos para seu e-mail.' };
  }

  async verifyResetCode(email: string, code: string): Promise<{ reset_token: string }> {
    const reset = await authRepository.findPasswordReset(email, code);

    if (!reset) {
      throw new InvalidCodeError();
    }

    if (isExpired(new Date(reset.expires_at))) {
      throw new CodeExpiredError();
    }

    const resetToken = generateResetToken(reset.user_id);
    return { reset_token: resetToken };
  }

  async resetPassword(resetToken: string, password: string): Promise<{ message: string }> {
    const { userId } = verifyResetToken(resetToken);

    const passwordHash = await hashPassword(password);
    await authRepository.updateUserPassword(userId, passwordHash);
    await authRepository.revokeAllUserRefreshTokens(userId);

    return { message: 'Senha alterada com sucesso!' };
  }

  async refreshToken(refreshTokenValue: string): Promise<RefreshResult> {
    const tokenHash = hashToken(refreshTokenValue);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken || storedToken.revoked_at || isExpired(new Date(storedToken.expires_at))) {
      throw new AccountDeactivatedError();
    }

    const user = await authRepository.findUserById(storedToken.user_id);
    if (!user || !user.is_active) {
      await authRepository.revokeRefreshToken(storedToken.id);
      throw new AccountDeactivatedError();
    }

    await authRepository.revokeRefreshToken(storedToken.id);

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      ongId: user.ong_id,
    });

    const newRefreshTokenRaw = generateConfirmationToken();
    const newRefreshTokenHash = hashToken(newRefreshTokenRaw);
    const refreshExpiresAt = addDays(new Date(), env.REFRESH_TOKEN_EXPIRY_DAYS);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      access_token: accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      refreshToken: newRefreshTokenRaw,
    };
  }

  async logout(refreshTokenValue: string): Promise<{ message: string }> {
    const tokenHash = hashToken(refreshTokenValue);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (storedToken) {
      await authRepository.revokeRefreshToken(storedToken.id);
    }

    return { message: 'Logout realizado com sucesso.' };
  }
}

export const authService = new AuthService();
