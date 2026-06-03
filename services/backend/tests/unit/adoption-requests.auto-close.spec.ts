import { AdoptionRequestsService } from '~/domains/adoption-requests/adoption-requests.service';
import { adoptionRequestsRepository } from '~/domains/adoption-requests/adoption-requests.repository';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

jest.mock('~/domains/adoption-requests/adoption-requests.repository');
jest.mock('~/shared/services/audit-log.shared', () => ({
  recordAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const mockedRepository = jest.mocked(adoptionRequestsRepository);

describe('AdoptionRequestsService - autoCloseByAnimal', () => {
  let service: AdoptionRequestsService;

  const animalId = 'animal-123';
  const ongId = 'ong-123';
  const userId = 'user-123';
  const fakeTrx = {} as never;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdoptionRequestsService();
  });

  it('should cancel all active requests and record audit logs for each', async () => {
    const cancelledIds = ['req-1', 'req-2', 'req-3'];
    mockedRepository.cancelAllActiveByAnimalId.mockResolvedValue(cancelledIds);

    await service.autoCloseByAnimal(animalId, ongId, userId, fakeTrx);

    expect(mockedRepository.cancelAllActiveByAnimalId).toHaveBeenCalledWith(animalId, fakeTrx);
    expect(recordAuditLog).toHaveBeenCalledTimes(3);

    for (const id of cancelledIds) {
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          ong_id: ongId,
          action: 'adoption_request.auto_close',
          entity: 'adoption_request',
          entity_id: id,
          metadata: { trigger: 'animal_adopted', animal_id: animalId },
        }),
      );
    }
  });

  it('should not record audit logs when no active requests exist', async () => {
    mockedRepository.cancelAllActiveByAnimalId.mockResolvedValue([]);

    await service.autoCloseByAnimal(animalId, ongId, userId, fakeTrx);

    expect(mockedRepository.cancelAllActiveByAnimalId).toHaveBeenCalledWith(animalId, fakeTrx);
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it('should cancel only pending and in_review requests (repository responsibility)', async () => {
    mockedRepository.cancelAllActiveByAnimalId.mockResolvedValue(['req-1', 'req-2']);

    await service.autoCloseByAnimal(animalId, ongId, userId, fakeTrx);

    expect(mockedRepository.cancelAllActiveByAnimalId).toHaveBeenCalledWith(animalId, fakeTrx);
    expect(recordAuditLog).toHaveBeenCalledTimes(2);
  });

  it('should pass the transaction to the repository', async () => {
    const specificTrx = { trxId: 'specific' } as never;
    mockedRepository.cancelAllActiveByAnimalId.mockResolvedValue([]);

    await service.autoCloseByAnimal(animalId, ongId, userId, specificTrx);

    expect(mockedRepository.cancelAllActiveByAnimalId).toHaveBeenCalledWith(animalId, specificTrx);
  });
});
