import { AnimalManagementService } from '~/domains/animal-management/animal-management.service';
import { animalManagementRepository } from '~/domains/animal-management/animal-management.repository';
import {
  OngNotApprovedError,
  AnimalNotFoundError,
  AnimalNotEditableError,
  ConcurrencyConflictError,
  CannotInactivateError,
  MediaLimitExceededError,
} from '~/domains/animal-management/animal-management.errors';
import { CreateAnimalInput } from '~/domains/animal-management/animal-management.types';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

jest.mock('~/domains/animal-management/animal-management.repository');
jest.mock('~/shared/services/audit-log.shared', () => ({
  recordAuditLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('~/shared/services/file-storage.service', () => ({
  fileStorage: {
    save: jest.fn().mockResolvedValue('/uploads/animals/test-file.jpg'),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockedRepository = jest.mocked(animalManagementRepository);

describe('AnimalManagementService', () => {
  let service: AnimalManagementService;

  const validInput: CreateAnimalInput = {
    name: 'Rex',
    species: 'dog',
    breed: 'Labrador',
    sex: 'male',
    castration: 'yes',
    temperament: ['docile', 'playful'],
    estimated_age_category: 'adult',
  };

  const userId = 'user-123';
  const ongId = 'ong-123';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnimalManagementService();
  });

  describe('create', () => {
    it('should create an animal successfully with required fields', async () => {
      mockedRepository.findOngStatus.mockResolvedValue('approved');
      mockedRepository.findDuplicate.mockResolvedValue(false);
      mockedRepository.create.mockResolvedValue({
        id: 'animal-1',
        name: 'Rex',
        species: 'dog',
        breed: 'Labrador',
        status: 'available',
        created_at: new Date(),
      });

      const result = await service.create(validInput, userId, ongId);

      expect(result.data.name).toBe('Rex');
      expect(result.data.species).toBe('dog');
      expect(result.data.status).toBe('available');
      expect(result.duplicateWarning).toBe(false);
      expect(mockedRepository.findOngStatus).toHaveBeenCalledWith(ongId);
      expect(mockedRepository.findDuplicate).toHaveBeenCalledWith(ongId, 'Rex', 'dog', 'Labrador');
      expect(mockedRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Rex',
          species: 'dog',
          breed: 'Labrador',
          ong_id: ongId,
        }),
      );
    });

    it('should return duplicateWarning true when duplicate exists', async () => {
      mockedRepository.findOngStatus.mockResolvedValue('approved');
      mockedRepository.findDuplicate.mockResolvedValue(true);
      mockedRepository.create.mockResolvedValue({
        id: 'animal-2',
        name: 'Rex',
        species: 'dog',
        breed: 'Labrador',
        status: 'available',
        created_at: new Date(),
      });

      const result = await service.create(validInput, userId, ongId);

      expect(result.duplicateWarning).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw OngNotApprovedError when ONG is not approved', async () => {
      mockedRepository.findOngStatus.mockResolvedValue('pending');

      await expect(service.create(validInput, userId, ongId)).rejects.toThrow(OngNotApprovedError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });

    it('should throw OngNotApprovedError when ONG does not exist', async () => {
      mockedRepository.findOngStatus.mockResolvedValue(null);

      await expect(service.create(validInput, userId, ongId)).rejects.toThrow(OngNotApprovedError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });

    it('should record audit log after successful creation', async () => {
      mockedRepository.findOngStatus.mockResolvedValue('approved');
      mockedRepository.findDuplicate.mockResolvedValue(false);
      mockedRepository.create.mockResolvedValue({
        id: 'animal-3',
        name: 'Rex',
        species: 'dog',
        breed: 'Labrador',
        status: 'available',
        created_at: new Date(),
      });

      await service.create(validInput, userId, ongId);

      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          ong_id: ongId,
          action: 'animal.create',
          entity: 'animal',
        }),
      );
    });
  });

  describe('list', () => {
    it('should list animals with filters', async () => {
      mockedRepository.list.mockResolvedValue({
        items: [
          { id: 'a1', name: 'Rex', species: 'dog', breed: 'Labrador', status: 'available', photo_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
        ],
        total: 1,
      });

      const result = await service.list(ongId, { page: 1, limit: 20 });

      expect(result.pagination.total).toBe(1);
      expect(mockedRepository.list).toHaveBeenCalledWith(ongId, { page: 1, limit: 20 });
    });
  });

  describe('findById', () => {
    it('should return animal with media when found', async () => {
      mockedRepository.findByIdWithMedia.mockResolvedValue({
        id: 'a1',
        ong_id: ongId,
        name: 'Rex',
        species: 'dog',
        breed: 'Labrador',
        sex: 'male',
        castration: 'yes',
        temperament: ['docile'],
        estimated_age_category: 'adult',
        size: null,
        weight_kg: null,
        height_cm: null,
        length_cm: null,
        special_needs: false,
        special_needs_description: null,
        rescue_observations: null,
        general_observations: null,
        status: 'available',
        media: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        inactivated_at: null,
      });

      const result = await service.findById('a1', ongId);

      expect(result.name).toBe('Rex');
      expect(mockedRepository.findByIdWithMedia).toHaveBeenCalledWith('a1', ongId);
    });

    it('should throw AnimalNotFoundError when animal does not exist', async () => {
      mockedRepository.findByIdWithMedia.mockResolvedValue(null);

      await expect(service.findById('nonexistent', ongId)).rejects.toThrow(AnimalNotFoundError);
    });
  });

  describe('update', () => {
    const mockAnimalRow = {
      id: 'a1',
      ong_id: ongId,
      name: 'Rex',
      species: 'dog' as const,
      breed: 'Labrador',
      sex: 'male' as const,
      castration: 'yes' as const,
      temperament: '["docile"]',
      estimated_age_category: 'adult' as const,
      size: null,
      weight_kg: null,
      height_cm: null,
      length_cm: null,
      special_needs: false,
      special_needs_description: null,
      rescue_observations: null,
      general_observations: null,
      status: 'available',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      inactivated_at: null,
    };

    it('should update an animal successfully', async () => {
      mockedRepository.findById.mockResolvedValue(mockAnimalRow);
      mockedRepository.update.mockResolvedValue(undefined);
      mockedRepository.findByIdWithMedia.mockResolvedValue({
        id: 'a1', ong_id: ongId, name: 'Rex Updated', species: 'dog', breed: 'Labrador',
        sex: 'male', castration: 'yes', temperament: ['docile'], estimated_age_category: 'adult',
        size: null, weight_kg: null, height_cm: null, length_cm: null, special_needs: false,
        special_needs_description: null, rescue_observations: null, general_observations: null,
        status: 'available', media: [], created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z', inactivated_at: null,
      });

      const result = await service.update(
        'a1',
        { ...validInput, name: 'Rex Updated', updated_at: '2024-01-01T00:00:00.000Z' },
        userId,
        ongId,
      );

      expect(result.name).toBe('Rex Updated');
    });

    it('should throw AnimalNotFoundError when animal does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { ...validInput, updated_at: '2024-01-01T00:00:00.000Z' }, userId, ongId),
      ).rejects.toThrow(AnimalNotFoundError);
    });

    it('should throw AnimalNotEditableError when animal is inactive', async () => {
      mockedRepository.findById.mockResolvedValue({ ...mockAnimalRow, status: 'inactive' });

      await expect(
        service.update('a1', { ...validInput, updated_at: '2024-01-01T00:00:00.000Z' }, userId, ongId),
      ).rejects.toThrow(AnimalNotEditableError);
    });

    it('should throw ConcurrencyConflictError when updated_at does not match', async () => {
      mockedRepository.findById.mockResolvedValue(mockAnimalRow);

      await expect(
        service.update('a1', { ...validInput, updated_at: '2020-01-01T00:00:00.000Z' }, userId, ongId),
      ).rejects.toThrow(ConcurrencyConflictError);
    });
  });

  describe('inactivate', () => {
    const mockAnimalRow = {
      id: 'a1', ong_id: ongId, name: 'Rex', species: 'dog' as const, breed: 'Labrador',
      sex: 'male' as const, castration: 'yes' as const, temperament: '["docile"]',
      estimated_age_category: 'adult' as const, size: null, weight_kg: null, height_cm: null,
      length_cm: null, special_needs: false, special_needs_description: null,
      rescue_observations: null, general_observations: null, status: 'available',
      created_at: new Date(), updated_at: new Date(), inactivated_at: null,
    };

    it('should inactivate an available animal', async () => {
      mockedRepository.findById.mockResolvedValue(mockAnimalRow);
      mockedRepository.inactivate.mockResolvedValue(undefined);

      const result = await service.inactivate('a1', userId, ongId);
      expect(result.status).toBe('inactive');
      expect(mockedRepository.inactivate).toHaveBeenCalledWith('a1');
    });

    it('should throw AnimalNotFoundError when animal does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(null);

      await expect(service.inactivate('nonexistent', userId, ongId)).rejects.toThrow(AnimalNotFoundError);
    });

    it('should throw CannotInactivateError when animal is already inactive', async () => {
      mockedRepository.findById.mockResolvedValue({ ...mockAnimalRow, status: 'inactive' });

      await expect(service.inactivate('a1', userId, ongId)).rejects.toThrow(CannotInactivateError);
    });
  });

  describe('uploadMedia', () => {
    const mockAnimalRow = {
      id: 'a1', ong_id: ongId, name: 'Rex', species: 'dog' as const, breed: 'Labrador',
      sex: 'male' as const, castration: 'yes' as const, temperament: '["docile"]',
      estimated_age_category: 'adult' as const, size: null, weight_kg: null, height_cm: null,
      length_cm: null, special_needs: false, special_needs_description: null,
      rescue_observations: null, general_observations: null, status: 'available',
      created_at: new Date(), updated_at: new Date(), inactivated_at: null,
    };

    const mockFile = {
      fieldname: 'file',
      originalname: 'photo.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: '/tmp',
      filename: 'tmp-file',
      path: '/tmp/tmp-file',
      size: 1024,
    } as Express.Multer.File;

    it('should upload media successfully', async () => {
      mockedRepository.findById.mockResolvedValue(mockAnimalRow);
      mockedRepository.countMedia.mockResolvedValue(0);
      mockedRepository.getNextMediaSortOrder.mockResolvedValue(1);
      mockedRepository.createMedia.mockResolvedValue({
        id: 'media-1',
        url: '/uploads/animals/test-file.jpg',
        type: 'photo',
        original_name: 'photo.jpg',
        size_bytes: 1024,
        mime_type: 'image/jpeg',
        sort_order: 1,
      });

      const result = await service.uploadMedia('a1', mockFile, 'photo', userId, ongId);

      expect(result.url).toBe('/uploads/animals/test-file.jpg');
    });

    it('should throw MediaLimitExceededError when limit reached', async () => {
      mockedRepository.findById.mockResolvedValue(mockAnimalRow);
      mockedRepository.countMedia.mockResolvedValue(3);

      await expect(service.uploadMedia('a1', mockFile, 'photo', userId, ongId)).rejects.toThrow(MediaLimitExceededError);
    });
  });

  describe('removeMedia', () => {
    const mockAnimalRow = {
      id: 'a1', ong_id: ongId, name: 'Rex', species: 'dog' as const, breed: 'Labrador',
      sex: 'male' as const, castration: 'yes' as const, temperament: '["docile"]',
      estimated_age_category: 'adult' as const, size: null, weight_kg: null, height_cm: null,
      length_cm: null, special_needs: false, special_needs_description: null,
      rescue_observations: null, general_observations: null, status: 'available',
      created_at: new Date(), updated_at: new Date(), inactivated_at: null,
    };

    it('should remove media successfully', async () => {
      mockedRepository.findById.mockResolvedValue(mockAnimalRow);
      mockedRepository.findMediaById.mockResolvedValue({ id: 'media-1', url: '/uploads/animals/test.jpg', animal_id: 'a1', type: 'photo' });
      mockedRepository.deleteMedia.mockResolvedValue(undefined);

      await expect(service.removeMedia('a1', 'media-1', userId, ongId)).resolves.toBeUndefined();
    });

    it('should throw AnimalNotFoundError when media does not exist', async () => {
      mockedRepository.findById.mockResolvedValue(mockAnimalRow);
      mockedRepository.findMediaById.mockResolvedValue(null);

      await expect(service.removeMedia('a1', 'nonexistent', userId, ongId)).rejects.toThrow(AnimalNotFoundError);
    });
  });
});
