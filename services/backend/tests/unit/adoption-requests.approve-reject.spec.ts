import { AdoptionRequestsService } from '~/domains/adoption-requests/adoption-requests.service';
import { adoptionRequestsRepository } from '~/domains/adoption-requests/adoption-requests.repository';
import {
  AdoptionRequestNotFoundError,
  InvalidRequestTransitionError,
} from '~/domains/adoption-requests/adoption-requests.errors';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

jest.mock('~/domains/adoption-requests/adoption-requests.repository');
jest.mock('~/shared/services/audit-log.shared', () => ({
  recordAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const mockedRepository = jest.mocked(adoptionRequestsRepository);

describe('AdoptionRequestsService - Approve/Reject/StartReview', () => {
  let service: AdoptionRequestsService;

  const userId = 'volunteer-123';
  const ongId = 'ong-123';
  const requestId = 'request-123';

  const mockOngRequest = (status: string) => ({
    id: requestId,
    status: status as 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'completed',
    animal_id: 'animal-123',
    adopter_id: 'adopter-123',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdoptionRequestsService();
  });

  describe('approve', () => {
    it('should approve a pending request successfully', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('pending'));
      mockedRepository.updateStatus.mockResolvedValue(undefined);

      await service.approve(requestId, userId, ongId);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(requestId, 'approved');
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'adoption_request.approve',
          entity: 'adoption_request',
          entity_id: requestId,
        }),
      );
    });

    it('should approve an in_review request successfully', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('in_review'));
      mockedRepository.updateStatus.mockResolvedValue(undefined);

      await service.approve(requestId, userId, ongId);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(requestId, 'approved');
    });

    it('should throw InvalidRequestTransitionError when approving a rejected request', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('rejected'));

      await expect(service.approve(requestId, userId, ongId)).rejects.toThrow(InvalidRequestTransitionError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidRequestTransitionError when approving a cancelled request', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('cancelled'));

      await expect(service.approve(requestId, userId, ongId)).rejects.toThrow(InvalidRequestTransitionError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw AdoptionRequestNotFoundError when request not found', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(null);

      await expect(service.approve(requestId, userId, ongId)).rejects.toThrow(AdoptionRequestNotFoundError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject a pending request with valid reason', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('pending'));
      mockedRepository.updateStatus.mockResolvedValue(undefined);

      await service.reject(requestId, { rejection_reason: 'Perfil não compatível com o animal.' }, userId, ongId);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(requestId, 'rejected', {
        rejection_reason: 'Perfil não compatível com o animal.',
      });
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'adoption_request.reject',
          entity: 'adoption_request',
          entity_id: requestId,
          metadata: { rejection_reason: 'Perfil não compatível com o animal.' },
        }),
      );
    });

    it('should reject an in_review request successfully', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('in_review'));
      mockedRepository.updateStatus.mockResolvedValue(undefined);

      await service.reject(requestId, { rejection_reason: 'Motivo da rejeição válido.' }, userId, ongId);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(requestId, 'rejected', {
        rejection_reason: 'Motivo da rejeição válido.',
      });
    });

    it('should throw InvalidRequestTransitionError when rejecting an approved request', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('approved'));

      await expect(
        service.reject(requestId, { rejection_reason: 'Motivo válido de rejeição.' }, userId, ongId),
      ).rejects.toThrow(InvalidRequestTransitionError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw AdoptionRequestNotFoundError when request not found', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(null);

      await expect(
        service.reject(requestId, { rejection_reason: 'Motivo válido de rejeição.' }, userId, ongId),
      ).rejects.toThrow(AdoptionRequestNotFoundError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('startReview', () => {
    it('should start review for a pending request', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('pending'));
      mockedRepository.updateStatus.mockResolvedValue(undefined);

      await service.startReview(requestId, userId, ongId);

      expect(mockedRepository.updateStatus).toHaveBeenCalledWith(requestId, 'in_review');
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'adoption_request.start_review',
          entity: 'adoption_request',
          entity_id: requestId,
        }),
      );
    });

    it('should throw InvalidRequestTransitionError when starting review for in_review request', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('in_review'));

      await expect(service.startReview(requestId, userId, ongId)).rejects.toThrow(InvalidRequestTransitionError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidRequestTransitionError when starting review for approved request', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(mockOngRequest('approved'));

      await expect(service.startReview(requestId, userId, ongId)).rejects.toThrow(InvalidRequestTransitionError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw AdoptionRequestNotFoundError for request from another ONG', async () => {
      mockedRepository.findByIdForOng.mockResolvedValue(null);

      await expect(service.startReview(requestId, userId, ongId)).rejects.toThrow(AdoptionRequestNotFoundError);
      expect(mockedRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
