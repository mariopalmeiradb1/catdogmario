import { AdoptionRequestsService } from '~/domains/adoption-requests/adoption-requests.service';
import { adoptionRequestsRepository } from '~/domains/adoption-requests/adoption-requests.repository';
import {
  AnimalNotAvailableError,
  DuplicateAdoptionRequestError,
  AdoptionRequestNotFoundError,
  CannotCancelRequestError,
} from '~/domains/adoption-requests/adoption-requests.errors';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

jest.mock('~/domains/adoption-requests/adoption-requests.repository');
jest.mock('~/shared/services/audit-log.shared', () => ({
  recordAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const mockedRepository = jest.mocked(adoptionRequestsRepository);

describe('AdoptionRequestsService', () => {
  let service: AdoptionRequestsService;

  const userId = 'adopter-123';
  const ongId = 'ong-123';
  const animalId = 'animal-123';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdoptionRequestsService();
  });

  describe('create', () => {
    it('should create an adoption request successfully', async () => {
      mockedRepository.findAnimalForAdoption.mockResolvedValue({
        id: animalId,
        ong_id: ongId,
        status: 'available',
        name: 'Rex',
      });
      mockedRepository.hasActiveRequest.mockResolvedValue(false);
      mockedRepository.create.mockResolvedValue({
        id: 'request-1',
        animal_id: animalId,
        status: 'pending',
        created_at: new Date(),
      });

      const result = await service.create({ animal_id: animalId }, userId);

      expect(result.status).toBe('pending');
      expect(result.animal_id).toBe(animalId);
      expect(mockedRepository.findAnimalForAdoption).toHaveBeenCalledWith(animalId);
      expect(mockedRepository.hasActiveRequest).toHaveBeenCalledWith(animalId, userId);
      expect(mockedRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          animal_id: animalId,
          adopter_id: userId,
          ong_id: ongId,
        }),
      );
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'adoption_request.create',
          entity: 'adoption_request',
          metadata: { animal_id: animalId, animal_name: 'Rex' },
        }),
      );
    });

    it('should throw AnimalNotAvailableError when animal not found', async () => {
      mockedRepository.findAnimalForAdoption.mockResolvedValue(null);

      await expect(service.create({ animal_id: animalId }, userId)).rejects.toThrow(AnimalNotAvailableError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });

    it('should throw AnimalNotAvailableError when animal status is in_adoption_process', async () => {
      mockedRepository.findAnimalForAdoption.mockResolvedValue({
        id: animalId,
        ong_id: ongId,
        status: 'in_adoption_process',
        name: 'Rex',
      });

      await expect(service.create({ animal_id: animalId }, userId)).rejects.toThrow(AnimalNotAvailableError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });

    it('should throw AnimalNotAvailableError when animal status is adopted', async () => {
      mockedRepository.findAnimalForAdoption.mockResolvedValue({
        id: animalId,
        ong_id: ongId,
        status: 'adopted',
        name: 'Rex',
      });

      await expect(service.create({ animal_id: animalId }, userId)).rejects.toThrow(AnimalNotAvailableError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });

    it('should throw DuplicateAdoptionRequestError when adopter has active request', async () => {
      mockedRepository.findAnimalForAdoption.mockResolvedValue({
        id: animalId,
        ong_id: ongId,
        status: 'available',
        name: 'Rex',
      });
      mockedRepository.hasActiveRequest.mockResolvedValue(true);

      await expect(service.create({ animal_id: animalId }, userId)).rejects.toThrow(DuplicateAdoptionRequestError);
      expect(mockedRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending request successfully', async () => {
      mockedRepository.findByIdForAdopter.mockResolvedValue({
        id: 'request-1',
        animal_id: animalId,
        animal_name: 'Rex',
        animal_species: 'dog',
        animal_breed: 'Labrador',
        adopter_id: userId,
        adopter_name: 'Adopter',
        adopter_email: 'adopter@test.com',
        ong_id: ongId,
        status: 'pending',
        rejection_reason: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockedRepository.updateStatus.mockResolvedValue(undefined);

      await service.cancel('request-1', userId);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith('request-1', 'cancelled', { cancelled_by: 'adopter' });
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'adoption_request.cancel',
          entity: 'adoption_request',
          entity_id: 'request-1',
        }),
      );
    });

    it('should cancel an in_review request successfully', async () => {
      mockedRepository.findByIdForAdopter.mockResolvedValue({
        id: 'request-2',
        animal_id: animalId,
        animal_name: 'Rex',
        animal_species: 'dog',
        animal_breed: 'Labrador',
        adopter_id: userId,
        adopter_name: 'Adopter',
        adopter_email: 'adopter@test.com',
        ong_id: ongId,
        status: 'in_review',
        rejection_reason: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockedRepository.updateStatus.mockResolvedValue(undefined);

      await service.cancel('request-2', userId);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith('request-2', 'cancelled', { cancelled_by: 'adopter' });
    });

    it('should throw CannotCancelRequestError when request is approved', async () => {
      mockedRepository.findByIdForAdopter.mockResolvedValue({
        id: 'request-3',
        animal_id: animalId,
        animal_name: 'Rex',
        animal_species: 'dog',
        animal_breed: 'Labrador',
        adopter_id: userId,
        adopter_name: 'Adopter',
        adopter_email: 'adopter@test.com',
        ong_id: ongId,
        status: 'approved',
        rejection_reason: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await expect(service.cancel('request-3', userId)).rejects.toThrow(CannotCancelRequestError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw AdoptionRequestNotFoundError when request does not exist', async () => {
      mockedRepository.findByIdForAdopter.mockResolvedValue(null);

      await expect(service.cancel('nonexistent', userId)).rejects.toThrow(AdoptionRequestNotFoundError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const mockDetail = {
      id: 'request-1',
      animal_id: animalId,
      animal_name: 'Rex',
      animal_species: 'dog',
      animal_breed: 'Labrador',
      adopter_id: userId,
      adopter_name: 'Adopter',
      adopter_email: 'adopter@test.com',
      ong_id: ongId,
      status: 'pending' as const,
      rejection_reason: null,
      cancelled_by: null,
      cancellation_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should return detail for adopter', async () => {
      mockedRepository.findByIdForAdopter.mockResolvedValue(mockDetail);

      const result = await service.findById('request-1', userId, 'adopter', null);

      expect(result.id).toBe('request-1');
      expect(mockedRepository.findByIdForAdopter).toHaveBeenCalledWith('request-1', userId);
    });

    it('should return detail for ong_volunteer', async () => {
      mockedRepository.findByIdForVolunteer.mockResolvedValue(mockDetail);

      const result = await service.findById('request-1', userId, 'ong_volunteer', ongId);

      expect(result.id).toBe('request-1');
      expect(mockedRepository.findByIdForVolunteer).toHaveBeenCalledWith('request-1', ongId);
    });

    it('should throw AdoptionRequestNotFoundError when not found', async () => {
      mockedRepository.findByIdForAdopter.mockResolvedValue(null);

      await expect(service.findById('nonexistent', userId, 'adopter', null)).rejects.toThrow(
        AdoptionRequestNotFoundError,
      );
    });
  });

  describe('list', () => {
    it('should return paginated list for ong', async () => {
      mockedRepository.list.mockResolvedValue({
        items: [
          {
            id: 'r1',
            animal_name: 'Rex',
            animal_species: 'dog',
            adopter_name: 'João',
            status: 'pending',
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
      });

      const result = await service.list(ongId, { page: 1, limit: 20 });

      expect(result.pagination.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(mockedRepository.list).toHaveBeenCalledWith(ongId, { page: 1, limit: 20 });
    });
  });

  describe('listMine', () => {
    it('should return paginated list for adopter', async () => {
      mockedRepository.listByAdopter.mockResolvedValue({
        items: [
          {
            id: 'r1',
            animal_name: 'Rex',
            animal_species: 'dog',
            animal_photo_url: null,
            animal_breed: 'Labrador',
            ong_name: 'ONG Teste',
            status: 'pending',
            rejection_reason: null,
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
      });

      const result = await service.listMine(userId, { page: 1, limit: 20 });

      expect(result.pagination.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(mockedRepository.listByAdopter).toHaveBeenCalledWith(userId, { page: 1, limit: 20 });
    });
  });
});
