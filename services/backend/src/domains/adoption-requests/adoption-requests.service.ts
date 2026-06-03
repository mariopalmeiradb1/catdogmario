import { adoptionRequestsRepository } from './adoption-requests.repository';
import type { Knex } from 'knex';
import {
  CreateAdoptionRequestInput,
  AdoptionRequestCreatedResponse,
  AdoptionRequestListFilters,
  AdoptionRequestListItem,
  AdoptionRequestDetail,
  AdopterRequestListFilters,
  AdopterRequestListItem,
  RejectAdoptionRequestInput,
  CANCELLABLE_STATUSES,
  APPROVABLE_STATUSES,
  REVIEWABLE_STATUSES,
} from './adoption-requests.types';
import {
  AnimalNotAvailableError,
  DuplicateAdoptionRequestError,
  AdoptionRequestNotFoundError,
  CannotCancelRequestError,
  InvalidRequestTransitionError,
} from './adoption-requests.errors';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

export class AdoptionRequestsService {
  async create(input: CreateAdoptionRequestInput, userId: string): Promise<AdoptionRequestCreatedResponse> {
    const animal = await adoptionRequestsRepository.findAnimalForAdoption(input.animal_id);
    if (!animal) {
      throw new AnimalNotAvailableError();
    }

    if (animal.status !== 'available') {
      throw new AnimalNotAvailableError();
    }

    const hasActive = await adoptionRequestsRepository.hasActiveRequest(input.animal_id, userId);
    if (hasActive) {
      throw new DuplicateAdoptionRequestError();
    }

    const id = crypto.randomUUID();
    const result = await adoptionRequestsRepository.create({
      id,
      animal_id: input.animal_id,
      adopter_id: userId,
      ong_id: animal.ong_id,
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: animal.ong_id,
      action: 'adoption_request.create',
      entity: 'adoption_request',
      entity_id: id,
      metadata: { animal_id: input.animal_id, animal_name: animal.name },
    });

    return result;
  }

  async list(
    ongId: string,
    filters: AdoptionRequestListFilters,
  ): Promise<{ data: AdoptionRequestListItem[]; pagination: { page: number; limit: number; total: number } }> {
    const { items, total } = await adoptionRequestsRepository.list(ongId, filters);
    return {
      data: items,
      pagination: { page: filters.page, limit: filters.limit, total },
    };
  }

  async listMine(
    userId: string,
    filters: AdopterRequestListFilters,
  ): Promise<{ data: AdopterRequestListItem[]; pagination: { page: number; limit: number; total: number } }> {
    const { items, total } = await adoptionRequestsRepository.listByAdopter(userId, filters);
    return {
      data: items,
      pagination: { page: filters.page, limit: filters.limit, total },
    };
  }

  async findById(id: string, userId: string, role: string, ongId: string | null): Promise<AdoptionRequestDetail> {
    let detail: AdoptionRequestDetail | null = null;

    if (role === 'adopter') {
      detail = await adoptionRequestsRepository.findByIdForAdopter(id, userId);
    } else if (role === 'ong_volunteer' || role === 'ong_admin') {
      detail = await adoptionRequestsRepository.findByIdForVolunteer(id, ongId!);
    }

    if (!detail) {
      throw new AdoptionRequestNotFoundError();
    }

    return detail;
  }

  async cancel(id: string, userId: string): Promise<void> {
    const request = await adoptionRequestsRepository.findByIdForAdopter(id, userId);
    if (!request) {
      throw new AdoptionRequestNotFoundError();
    }

    if (!CANCELLABLE_STATUSES.includes(request.status)) {
      throw new CannotCancelRequestError();
    }

    await adoptionRequestsRepository.updateStatus(id, 'cancelled', { cancelled_by: 'adopter' });

    await recordAuditLog({
      user_id: userId,
      ong_id: request.ong_id,
      action: 'adoption_request.cancel',
      entity: 'adoption_request',
      entity_id: id,
    });
  }

  async startReview(id: string, userId: string, ongId: string): Promise<void> {
    const request = await adoptionRequestsRepository.findByIdForOng(id, ongId);
    if (!request) {
      throw new AdoptionRequestNotFoundError();
    }

    if (!REVIEWABLE_STATUSES.includes(request.status)) {
      throw new InvalidRequestTransitionError('colocado em análise');
    }

    await adoptionRequestsRepository.updateStatus(id, 'in_review');

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'adoption_request.start_review',
      entity: 'adoption_request',
      entity_id: id,
    });
  }

  async approve(id: string, userId: string, ongId: string): Promise<void> {
    const request = await adoptionRequestsRepository.findByIdForOng(id, ongId);
    if (!request) {
      throw new AdoptionRequestNotFoundError();
    }

    if (!APPROVABLE_STATUSES.includes(request.status)) {
      throw new InvalidRequestTransitionError('aprovado');
    }

    await adoptionRequestsRepository.updateStatus(id, 'approved');

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'adoption_request.approve',
      entity: 'adoption_request',
      entity_id: id,
    });
  }

  async reject(id: string, input: RejectAdoptionRequestInput, userId: string, ongId: string): Promise<void> {
    const request = await adoptionRequestsRepository.findByIdForOng(id, ongId);
    if (!request) {
      throw new AdoptionRequestNotFoundError();
    }

    if (!APPROVABLE_STATUSES.includes(request.status)) {
      throw new InvalidRequestTransitionError('rejeitado');
    }

    await adoptionRequestsRepository.updateStatus(id, 'rejected', { rejection_reason: input.rejection_reason });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'adoption_request.reject',
      entity: 'adoption_request',
      entity_id: id,
      metadata: { rejection_reason: input.rejection_reason },
    });
  }

  async autoCloseByAnimal(animalId: string, ongId: string, triggeredByUserId: string, trx: Knex.Transaction): Promise<void> {
    const cancelledIds = await adoptionRequestsRepository.cancelAllActiveByAnimalId(animalId, trx);

    for (const id of cancelledIds) {
      await recordAuditLog({
        user_id: triggeredByUserId,
        ong_id: ongId,
        action: 'adoption_request.auto_close',
        entity: 'adoption_request',
        entity_id: id,
        metadata: { trigger: 'animal_adopted', animal_id: animalId },
      });
    }
  }
}

export const adoptionRequestsService = new AdoptionRequestsService();
