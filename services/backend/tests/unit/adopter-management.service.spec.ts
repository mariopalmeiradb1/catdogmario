import { AdopterManagementService } from '~/domains/adopter-management/adopter-management.service';
import { adopterManagementRepository } from '~/domains/adopter-management/adopter-management.repository';
import {
  AdopterProfileAlreadyExistsError,
  AdopterProfileNotFoundError,
  CpfAlreadyRegisteredError,
  InvalidCpfError,
  UnauthorizedProfileAccessError,
  UnderageAdopterError,
} from '~/domains/adopter-management/adopter-management.errors';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

jest.mock('~/domains/adopter-management/adopter-management.repository');
jest.mock('~/shared/services/audit-log.shared', () => ({
  recordAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const mockedRepository = jest.mocked(adopterManagementRepository);

describe('AdopterManagementService', () => {
  let service: AdopterManagementService;

  const userId = 'user-123';
  const profileId = 'profile-123';
  const ongId = 'ong-123';

  const validInput = {
    full_name: 'João da Silva',
    cpf: '529.982.247-25',
    rg: '123456789',
    birth_date: '1990-05-15',
    phone: '11999999999',
    cep: '01001000',
    street: 'Rua dos Testes',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    has_current_animals: false,
    had_animals_before: false,
  };

  const existingProfile = {
    id: profileId,
    user_id: userId,
    full_name: 'João da Silva',
    cpf: '52998224725',
    rg: '123456789',
    birth_date: '1990-05-15',
    phone: '11999999999',
    cep: '01001000',
    street: 'Rua dos Testes',
    number: '123',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    has_current_animals: false,
    current_animals_description: null,
    had_animals_before: false,
    previous_animals_description: null,
    status: 'active' as const,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdopterManagementService();
  });

  describe('create', () => {
    it('should create adopter profile successfully', async () => {
      mockedRepository.findByUserId.mockResolvedValue(null);
      mockedRepository.findByCpf.mockResolvedValue(null);
      mockedRepository.create.mockResolvedValue(existingProfile);

      const result = await service.create(validInput, userId);

      expect(result.id).toBe(profileId);
      expect(result.full_name).toBe('João da Silva');
      expect(mockedRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockedRepository.findByCpf).toHaveBeenCalledWith('52998224725');
      expect(mockedRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          cpf: '52998224725',
          full_name: 'João da Silva',
        }),
      );
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'adopter_profile.create',
          entity: 'adopter_profile',
        }),
      );
    });

    it('should throw AdopterProfileAlreadyExistsError when user already has profile', async () => {
      mockedRepository.findByUserId.mockResolvedValue(existingProfile);

      await expect(service.create(validInput, userId)).rejects.toThrow(AdopterProfileAlreadyExistsError);
    });

    it('should throw InvalidCpfError when CPF is invalid', async () => {
      mockedRepository.findByUserId.mockResolvedValue(null);

      const invalidInput = { ...validInput, cpf: '11111111111' };
      await expect(service.create(invalidInput, userId)).rejects.toThrow(InvalidCpfError);
    });

    it('should throw CpfAlreadyRegisteredError when CPF is already taken', async () => {
      mockedRepository.findByUserId.mockResolvedValue(null);
      mockedRepository.findByCpf.mockResolvedValue(existingProfile);

      await expect(service.create(validInput, userId)).rejects.toThrow(CpfAlreadyRegisteredError);
    });

    it('should throw UnderageAdopterError when adopter is under 18', async () => {
      mockedRepository.findByUserId.mockResolvedValue(null);
      mockedRepository.findByCpf.mockResolvedValue(null);

      const today = new Date();
      const underageBirthDate = `${today.getFullYear() - 17}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const underageInput = { ...validInput, cpf: '52998224725', birth_date: underageBirthDate };

      await expect(service.create(underageInput, userId)).rejects.toThrow(UnderageAdopterError);
    });

    it('should succeed when adopter is exactly 18 years old today', async () => {
      mockedRepository.findByUserId.mockResolvedValue(null);
      mockedRepository.findByCpf.mockResolvedValue(null);
      mockedRepository.create.mockResolvedValue(existingProfile);

      const today = new Date();
      const exactlyEighteen = `${today.getFullYear() - 18}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const input = { ...validInput, cpf: '52998224725', birth_date: exactlyEighteen };

      const result = await service.create(input, userId);
      expect(result.id).toBe(profileId);
    });
  });

  describe('getMyProfile', () => {
    it('should return profile when it exists', async () => {
      mockedRepository.findByUserId.mockResolvedValue(existingProfile);

      const result = await service.getMyProfile(userId);
      expect(result.id).toBe(profileId);
    });

    it('should throw AdopterProfileNotFoundError when no profile', async () => {
      mockedRepository.findByUserId.mockResolvedValue(null);

      await expect(service.getMyProfile(userId)).rejects.toThrow(AdopterProfileNotFoundError);
    });
  });

  describe('updateMyProfile', () => {
    it('should update profile successfully with detailed audit changes', async () => {
      const updatedProfile = { ...existingProfile, phone: '11888888888' };
      mockedRepository.findByUserId.mockResolvedValue(existingProfile);
      mockedRepository.update.mockResolvedValue(updatedProfile);

      const result = await service.updateMyProfile(userId, { phone: '11888888888' });

      expect(result.phone).toBe('11888888888');
      expect(mockedRepository.update).toHaveBeenCalledWith(userId, { phone: '11888888888' });
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'adopter_profile.update',
          metadata: {
            changes: [{ field: 'phone', old_value: '11999999999', new_value: '11888888888' }],
          },
        }),
      );
    });

    it('should throw UnderageAdopterError when new birth_date makes adopter under 18', async () => {
      mockedRepository.findByUserId.mockResolvedValue(existingProfile);

      const today = new Date();
      const underageBirthDate = `${today.getFullYear() - 10}-01-01`;

      await expect(
        service.updateMyProfile(userId, { birth_date: underageBirthDate }),
      ).rejects.toThrow(UnderageAdopterError);
    });

    it('should throw AdopterProfileNotFoundError when no profile exists', async () => {
      mockedRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.updateMyProfile(userId, { phone: '11888888888' }),
      ).rejects.toThrow(AdopterProfileNotFoundError);
    });
  });

  describe('getProfileForVolunteer', () => {
    it('should return masked profile when volunteer has adoption request', async () => {
      mockedRepository.findById.mockResolvedValue(existingProfile);
      mockedRepository.hasAdoptionRequestInOng.mockResolvedValue(true);

      const result = await service.getProfileForVolunteer(profileId, ongId);

      expect(result.cpf).toBe('***.982.247-**');
      expect(result.rg).toBe('*****6789');
      expect(result.full_name).toBe('João da Silva');
    });

    it('should throw UnauthorizedProfileAccessError when no request in ONG', async () => {
      mockedRepository.findById.mockResolvedValue(existingProfile);
      mockedRepository.hasAdoptionRequestInOng.mockResolvedValue(false);

      await expect(
        service.getProfileForVolunteer(profileId, ongId),
      ).rejects.toThrow(UnauthorizedProfileAccessError);
    });

    it('should throw AdopterProfileNotFoundError when profile does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(
        service.getProfileForVolunteer(profileId, ongId),
      ).rejects.toThrow(AdopterProfileNotFoundError);
    });
  });
});
