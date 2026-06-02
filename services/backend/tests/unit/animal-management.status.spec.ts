import { AnimalManagementService } from '~/domains/animal-management/animal-management.service';
import { animalManagementRepository } from '~/domains/animal-management/animal-management.repository';
import {
  AnimalNotFoundError,
  InvalidStatusTransitionError,
} from '~/domains/animal-management/animal-management.errors';

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
jest.mock('~/config/database', () => ({
  db: {
    transaction: jest.fn((callback: (trx: unknown) => Promise<unknown>) => callback({})),
  },
}));

const mockedRepository = jest.mocked(animalManagementRepository);
const { recordAuditLog } = jest.requireMock('~/shared/services/audit-log.shared');

describe('AnimalManagementService - Status Transitions', () => {
  let service: AnimalManagementService;

  const userId = 'user-123';
  const ongId = 'ong-123';
  const animalId = 'animal-123';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnimalManagementService();
  });

  describe('startAdoptionProcess', () => {
    it('should transition animal from available to in_adoption_process', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        ong_id: ongId,
        name: 'Rex',
        species: 'dog',
        breed: 'Labrador',
        sex: 'male',
        castration: 'yes',
        temperament: '["docile"]',
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
        created_at: new Date(),
        updated_at: new Date(),
        inactivated_at: null,
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      const result = await service.startAdoptionProcess(animalId, userId, ongId);

      expect(result.id).toBe(animalId);
      expect(result.status).toBe('in_adoption_process');
      expect(result.updated_at).toBeDefined();
      expect(mockedRepository.findByIdForUpdate).toHaveBeenCalledWith(animalId, ongId, expect.anything());
      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(animalId, 'in_adoption_process', null, expect.anything());
    });

    it('should create status history with correct data', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'available',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      await service.startAdoptionProcess(animalId, userId, ongId);

      expect(mockedRepository.createStatusHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          animal_id: animalId,
          from_status: 'available',
          to_status: 'in_adoption_process',
          trigger_type: 'automatic',
          trigger_reason: 'visit_scheduled',
          triggered_by: userId,
        }),
        expect.anything(),
      );
    });

    it('should record audit log after successful transition', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'available',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      await service.startAdoptionProcess(animalId, userId, ongId);

      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          ong_id: ongId,
          action: 'animal.status.start_adoption_process',
          entity: 'animal',
          entity_id: animalId,
          metadata: { from_status: 'available', to_status: 'in_adoption_process' },
        }),
      );
    });

    it('should throw InvalidStatusTransitionError when animal is in_adoption_process', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);

      await expect(service.startAdoptionProcess(animalId, userId, ongId))
        .rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw InvalidStatusTransitionError when animal is adopted', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'adopted',
      } as never);

      await expect(service.startAdoptionProcess(animalId, userId, ongId))
        .rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw AnimalNotFoundError when animal does not exist', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue(null as never);

      await expect(service.startAdoptionProcess(animalId, userId, ongId))
        .rejects.toThrow(AnimalNotFoundError);
    });
  });

  describe('revertToAvailable', () => {
    it('should transition animal from in_adoption_process to available', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      const result = await service.revertToAvailable(animalId, userId, ongId);

      expect(result.id).toBe(animalId);
      expect(result.status).toBe('available');
      expect(result.updated_at).toBeDefined();
      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(animalId, 'available', null, expect.anything());
    });

    it('should create status history with trigger_reason all_visits_cancelled', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      await service.revertToAvailable(animalId, userId, ongId);

      expect(mockedRepository.createStatusHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          animal_id: animalId,
          from_status: 'in_adoption_process',
          to_status: 'available',
          trigger_type: 'automatic',
          trigger_reason: 'all_visits_cancelled',
          triggered_by: userId,
        }),
        expect.anything(),
      );
    });

    it('should record audit log with correct action', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      await service.revertToAvailable(animalId, userId, ongId);

      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'animal.status.revert_to_available',
          metadata: { from_status: 'in_adoption_process', to_status: 'available' },
        }),
      );
    });

    it('should throw InvalidStatusTransitionError when animal is available', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'available',
      } as never);

      await expect(service.revertToAvailable(animalId, userId, ongId))
        .rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw InvalidStatusTransitionError when animal is adopted', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'adopted',
      } as never);

      await expect(service.revertToAvailable(animalId, userId, ongId))
        .rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw AnimalNotFoundError when animal does not exist', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue(null as never);

      await expect(service.revertToAvailable(animalId, userId, ongId))
        .rejects.toThrow(AnimalNotFoundError);
    });
  });

  describe('confirmAdoption', () => {
    const termNumber = 'TR-2026-001';

    it('should transition animal from in_adoption_process to adopted', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      const result = await service.confirmAdoption(animalId, userId, ongId, termNumber);

      expect(result.id).toBe(animalId);
      expect(result.status).toBe('adopted');
      expect(result.adopted_at).toBeDefined();
      expect(result.responsibility_term_number).toBe(termNumber);
    });

    it('should update status with responsibility_term_number and adopted_at', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      await service.confirmAdoption(animalId, userId, ongId, termNumber);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(
        animalId,
        'adopted',
        expect.objectContaining({
          responsibility_term_number: termNumber,
          adopted_at: expect.any(Date),
        }),
        expect.anything(),
      );
    });

    it('should create status history with trigger_type manual', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      await service.confirmAdoption(animalId, userId, ongId, termNumber);

      expect(mockedRepository.createStatusHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          animal_id: animalId,
          from_status: 'in_adoption_process',
          to_status: 'adopted',
          trigger_type: 'manual',
          trigger_reason: 'adoption_confirmed',
          triggered_by: userId,
          metadata: { responsibility_term_number: termNumber },
        }),
        expect.anything(),
      );
    });

    it('should record audit log with action confirm_adoption', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'in_adoption_process',
      } as never);
      mockedRepository.updateStatus.mockResolvedValue(undefined);
      mockedRepository.createStatusHistory.mockResolvedValue(undefined);

      await service.confirmAdoption(animalId, userId, ongId, termNumber);

      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'animal.status.confirm_adoption',
          metadata: { to_status: 'adopted', responsibility_term_number: termNumber },
        }),
      );
    });

    it('should throw InvalidStatusTransitionError when animal is available', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'available',
      } as never);

      await expect(service.confirmAdoption(animalId, userId, ongId, termNumber))
        .rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw InvalidStatusTransitionError when animal is already adopted', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue({
        id: animalId,
        status: 'adopted',
      } as never);

      await expect(service.confirmAdoption(animalId, userId, ongId, termNumber))
        .rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw AnimalNotFoundError when animal does not exist', async () => {
      mockedRepository.findByIdForUpdate.mockResolvedValue(null as never);

      await expect(service.confirmAdoption(animalId, userId, ongId, termNumber))
        .rejects.toThrow(AnimalNotFoundError);
    });
  });
});
