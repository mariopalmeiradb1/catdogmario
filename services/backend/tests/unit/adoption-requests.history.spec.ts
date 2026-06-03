import { AdoptionRequestsService } from '~/domains/adoption-requests/adoption-requests.service';
import { adoptionRequestsRepository } from '~/domains/adoption-requests/adoption-requests.repository';
import { AdoptionRequestNotFoundError } from '~/domains/adoption-requests/adoption-requests.errors';

jest.mock('~/domains/adoption-requests/adoption-requests.repository');
jest.mock('~/shared/services/audit-log.shared', () => ({
  recordAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const mockedRepository = jest.mocked(adoptionRequestsRepository);

describe('AdoptionRequestsService - History', () => {
  let service: AdoptionRequestsService;

  const userId = 'adopter-123';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdoptionRequestsService();
  });

  describe('listMine with date filters', () => {
    it('should pass date_from and date_to to repository', async () => {
      mockedRepository.listByAdopter.mockResolvedValue({ items: [], total: 0 });

      const filters = {
        status: 'completed' as const,
        date_from: '2026-01-01T00:00:00.000Z',
        date_to: '2026-06-01T23:59:59.999Z',
        page: 1,
        limit: 10,
      };

      await service.listMine(userId, filters);

      expect(mockedRepository.listByAdopter).toHaveBeenCalledWith(userId, filters);
    });

    it('should return paginated results', async () => {
      const items = [
        {
          id: 'req-1',
          animal_name: 'Rex',
          animal_species: 'dog',
          animal_photo_url: '/uploads/animals/photo.jpg',
          animal_breed: 'Labrador',
          ong_name: 'ONG Teste',
          status: 'completed' as const,
          rejection_reason: null,
          created_at: '2026-03-15T10:00:00.000Z',
        },
      ];
      mockedRepository.listByAdopter.mockResolvedValue({ items, total: 1 });

      const result = await service.listMine(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].animal_photo_url).toBe('/uploads/animals/photo.jpg');
      expect(result.data[0].animal_breed).toBe('Labrador');
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1 });
    });

    it('should work without date filters', async () => {
      mockedRepository.listByAdopter.mockResolvedValue({ items: [], total: 0 });

      await service.listMine(userId, { page: 1, limit: 10 });

      expect(mockedRepository.listByAdopter).toHaveBeenCalledWith(userId, { page: 1, limit: 10 });
    });
  });

  describe('getDetailForAdopter', () => {
    it('should return detail for valid request', async () => {
      const detail = {
        id: 'req-1',
        animal_name: 'Rex',
        animal_species: 'dog',
        animal_breed: 'Labrador',
        animal_photo_url: '/uploads/animals/photo.jpg',
        ong_name: 'ONG Teste',
        status: 'rejected' as const,
        rejection_reason: 'Motivo qualquer de teste',
        cancelled_by: null,
        cancellation_reason: null,
        created_at: '2026-03-15T10:00:00.000Z',
        updated_at: '2026-03-20T14:00:00.000Z',
        completed_at: null,
      };
      mockedRepository.findDetailForAdopter.mockResolvedValue(detail);

      const result = await service.getDetailForAdopter('req-1', userId);

      expect(result).toEqual(detail);
      expect(mockedRepository.findDetailForAdopter).toHaveBeenCalledWith('req-1', userId);
    });

    it('should return detail with completed_at for completed request', async () => {
      const detail = {
        id: 'req-2',
        animal_name: 'Mia',
        animal_species: 'cat',
        animal_breed: 'Siamês',
        animal_photo_url: null,
        ong_name: 'ONG Gatos',
        status: 'completed' as const,
        rejection_reason: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: '2026-01-10T10:00:00.000Z',
        updated_at: '2026-02-15T14:00:00.000Z',
        completed_at: '2026-02-15T14:00:00.000Z',
      };
      mockedRepository.findDetailForAdopter.mockResolvedValue(detail);

      const result = await service.getDetailForAdopter('req-2', userId);

      expect(result.completed_at).toBe('2026-02-15T14:00:00.000Z');
      expect(result.status).toBe('completed');
    });

    it('should throw AdoptionRequestNotFoundError when request not found', async () => {
      mockedRepository.findDetailForAdopter.mockResolvedValue(null);

      await expect(service.getDetailForAdopter('nonexistent', userId)).rejects.toThrow(
        AdoptionRequestNotFoundError,
      );
    });

    it('should throw AdoptionRequestNotFoundError for request of another adopter', async () => {
      mockedRepository.findDetailForAdopter.mockResolvedValue(null);

      await expect(service.getDetailForAdopter('req-1', 'other-user')).rejects.toThrow(
        AdoptionRequestNotFoundError,
      );
    });
  });
});
