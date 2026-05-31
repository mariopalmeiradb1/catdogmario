import { AuthService } from '~/domains/auth/auth.service';
import { authRepository } from '~/domains/auth/auth.repository';
import { mailService } from '~/shared/services/mail/mail.service';
import {
  EmailAlreadyExistsError,
  CnpjAlreadyExistsError,
  InvalidCredentialsError,
  EmailNotConfirmedError,
  OngPendingApprovalError,
} from '~/domains/auth/auth.errors';
import * as hashUtil from '~/shared/utils/hash.util';

jest.mock('~/domains/auth/auth.repository');
jest.mock('~/shared/services/mail/mail.service');

const mockRepo = authRepository as jest.Mocked<typeof authRepository>;
const mockMail = mailService as jest.Mocked<typeof mailService>;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('registerAdopter', () => {
    const validInput = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'Test@123',
      password_confirmation: 'Test@123',
    };

    it('should register an adopter successfully', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.createUser.mockResolvedValue('user-id');
      mockRepo.createEmailConfirmation.mockResolvedValue(undefined);
      mockMail.send.mockResolvedValue(undefined);

      const result = await service.registerAdopter(validInput);

      expect(result.message).toBe('Cadastro realizado! Verifique seu e-mail para ativar sua conta.');
      expect(mockRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@email.com',
          role: 'adopter',
          ong_id: null,
        }),
      );
      expect(mockRepo.createEmailConfirmation).toHaveBeenCalled();
      expect(mockMail.send).toHaveBeenCalled();
    });

    it('should throw EmailAlreadyExistsError if email exists', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({ id: 'existing' } as never);

      await expect(service.registerAdopter(validInput)).rejects.toThrow(EmailAlreadyExistsError);
    });
  });

  describe('registerOng', () => {
    const validInput = {
      name: 'Maria Admin',
      email: 'maria@ong.com',
      password: 'Test@123',
      password_confirmation: 'Test@123',
      ong_name: 'ONG Patinhas',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 99999-9999',
      address: 'Rua dos Gatos, 123',
      description: 'Uma ONG dedicada ao resgate e cuidado de animais abandonados nas ruas da cidade.',
      capacity: 20,
    };

    it('should register ONG admin successfully', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.findOngByCnpj.mockResolvedValue(null);
      mockRepo.createOng.mockResolvedValue('ong-id');
      mockRepo.createUser.mockResolvedValue('user-id');
      mockRepo.createEmailConfirmation.mockResolvedValue(undefined);
      mockMail.send.mockResolvedValue(undefined);

      const result = await service.registerOng(validInput);

      expect(result.message).toContain('sua ONG passará por aprovação');
      expect(mockRepo.createOng).toHaveBeenCalled();
      expect(mockRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ong_admin' }),
      );
    });

    it('should throw EmailAlreadyExistsError if email exists', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({ id: 'existing' } as never);

      await expect(service.registerOng(validInput)).rejects.toThrow(EmailAlreadyExistsError);
    });

    it('should throw CnpjAlreadyExistsError if CNPJ exists', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.findOngByCnpj.mockResolvedValue({ id: 'existing' } as never);

      await expect(service.registerOng(validInput)).rejects.toThrow(CnpjAlreadyExistsError);
    });
  });

  describe('login', () => {
    const loginInput = { email: 'user@email.com', password: 'Test@123' };

    it('should throw InvalidCredentialsError if user not found', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);

      await expect(service.login(loginInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError if password is wrong', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({
        id: 'user-1',
        password_hash: 'some-hash',
        is_active: true,
        email_confirmed_at: new Date(),
        role: 'adopter',
        ong_id: null,
      } as never);
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

      await expect(service.login(loginInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw EmailNotConfirmedError if email not confirmed', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({
        id: 'user-1',
        password_hash: 'some-hash',
        is_active: true,
        email_confirmed_at: null,
        role: 'adopter',
        ong_id: null,
      } as never);
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

      await expect(service.login(loginInput)).rejects.toThrow(EmailNotConfirmedError);
    });

    it('should throw OngPendingApprovalError if ONG is pending', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({
        id: 'user-1',
        password_hash: 'some-hash',
        is_active: true,
        email_confirmed_at: new Date(),
        role: 'ong_admin',
        ong_id: 'ong-1',
        name: 'Admin',
        email: 'admin@ong.com',
      } as never);
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);
      mockRepo.findOngById.mockResolvedValue({ status: 'pending' } as never);

      await expect(service.login(loginInput)).rejects.toThrow(OngPendingApprovalError);
    });

    it('should return tokens on successful login', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'user@email.com',
        password_hash: 'some-hash',
        is_active: true,
        email_confirmed_at: new Date(),
        role: 'adopter',
        ong_id: null,
      } as never);
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);
      mockRepo.createRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginInput);

      expect(result.access_token).toBeDefined();
      expect(result.user.role).toBe('adopter');
      expect(result.refreshToken).toBeDefined();
    });
  });
});
