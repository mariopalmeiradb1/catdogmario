import { adoptionRequestsRepository } from './adoption-requests.repository';
import type { Knex } from 'knex';
import { db } from '~/config/database';
import {
  CreateAdoptionRequestInput,
  AdoptionRequestCreatedResponse,
  AdoptionRequestListFilters,
  AdoptionRequestListItem,
  AdoptionRequestDetail,
  AdopterRequestListFilters,
  AdopterRequestListItem,
  AdopterRequestDetail,
  RejectAdoptionRequestInput,
  ScheduleVisitInput,
  ScheduleVisitResponse,
  CompleteVisitInput,
  VisitDetailVolunteer,
  VisitDetailAdopter,
  CANCELLABLE_STATUSES,
  APPROVABLE_STATUSES,
  REVIEWABLE_STATUSES,
  VISIT_ELIGIBLE_STATUSES,
} from './adoption-requests.types';
import {
  AnimalNotAvailableError,
  DuplicateAdoptionRequestError,
  AdoptionRequestNotFoundError,
  CannotCancelRequestError,
  InvalidRequestTransitionError,
  AnimalAlreadyInProcessError,
  AnimalAlreadyAdoptedError,
  RequestNotEligibleForVisitError,
  InvalidVisitDateError,
  VisitNotFoundError,
  VisitAlreadyCompletedError,
  VisitCancelledError,
  InvalidCompletionDateError,
  VisitOngMismatchError,
} from './adoption-requests.errors';
import { recordAuditLog } from '~/shared/services/audit-log.shared';
import { animalManagementRepository } from '~/domains/animal-management/animal-management.repository';
import { mailService } from '~/shared/services/mail/mail.service';
import { buildVisitScheduledEmail } from '~/shared/services/mail/mail.templates';

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

  async getDetailForAdopter(requestId: string, userId: string): Promise<AdopterRequestDetail> {
    const detail = await adoptionRequestsRepository.findDetailForAdopter(requestId, userId);
    if (!detail) {
      throw new AdoptionRequestNotFoundError();
    }
    return detail;
  }

  // Visit scheduling (TASK-BACKEND-009)

  async scheduleVisit(requestId: string, input: ScheduleVisitInput, userId: string, ongId: string): Promise<ScheduleVisitResponse> {
    const visitId = crypto.randomUUID();
    let adoptionRequestId: string;
    let animalId: string;
    let animalName: string;
    let adopterEmail: string;
    let adopterName: string;
    let ongName: string;
    let ongAddress: string;
    let ongCity: string;
    let ongState: string;
    let cancelledCount = 0;

    await db.transaction(async (trx) => {
      const request = await adoptionRequestsRepository.findRequestWithAnimalAndAdopter(requestId, ongId, trx);
      if (!request) {
        throw new AdoptionRequestNotFoundError();
      }

      if (!VISIT_ELIGIBLE_STATUSES.includes(request.status)) {
        throw new RequestNotEligibleForVisitError();
      }

      if (request.animal_status === 'in_adoption_process') {
        throw new AnimalAlreadyInProcessError();
      }
      if (request.animal_status === 'adopted') {
        throw new AnimalAlreadyAdoptedError();
      }

      this.validateVisitDate(input.visit_date);

      const hasActive = await adoptionRequestsRepository.hasActiveVisitForAnimal(request.animal_id, trx);
      if (hasActive) {
        throw new AnimalAlreadyInProcessError();
      }

      await adoptionRequestsRepository.createVisit({
        id: visitId,
        adoption_request_id: requestId,
        animal_id: request.animal_id,
        ong_id: ongId,
        scheduled_by: userId,
        visit_date: input.visit_date,
        notes: input.notes,
        status: 'scheduled',
      }, trx);

      await animalManagementRepository.updateStatus(request.animal_id, 'in_adoption_process', null, trx);

      const cancelledIds = await adoptionRequestsRepository.cancelAllActiveByAnimalId(request.animal_id, trx, requestId);
      cancelledCount = cancelledIds.length;

      adoptionRequestId = requestId;
      animalId = request.animal_id;
      animalName = request.animal_name;
      adopterEmail = request.adopter_email;
      adopterName = request.adopter_name;
      ongName = request.ong_name;
      ongAddress = request.ong_address;
      ongCity = request.ong_city;
      ongState = request.ong_state;
    });

    await mailService.send({
      to: adopterEmail!,
      subject: 'Visita Agendada - CatDog Mário',
      html: buildVisitScheduledEmail({
        adopterName: adopterName!,
        animalName: animalName!,
        visitDate: input.visit_date,
        ongName: ongName!,
        ongAddress: ongAddress!,
        ongCity: ongCity!,
        ongState: ongState!,
      }),
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'visit.schedule',
      entity: 'visit',
      entity_id: visitId,
      metadata: { adoption_request_id: adoptionRequestId!, animal_id: animalId!, cancelled_count: cancelledCount },
    });

    return {
      id: visitId,
      adoption_request_id: adoptionRequestId!,
      animal_name: animalName!,
      visit_date: input.visit_date,
      status: 'scheduled',
      created_at: new Date().toISOString(),
    };
  }

  private validateVisitDate(visitDate: string): void {
    const date = new Date(visitDate);
    const now = new Date();

    if (date <= now) {
      throw new InvalidVisitDateError('A data da visita deve ser no futuro.');
    }

    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      throw new InvalidVisitDateError('A data da visita deve ter no mínimo 24 horas de antecedência.');
    }

    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      throw new InvalidVisitDateError('A data da visita deve ser no máximo 30 dias no futuro.');
    }

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      throw new InvalidVisitDateError('O horário da visita deve ser entre 08:00 e 18:00, de segunda a sábado.');
    }

    const hour = date.getHours();
    if (hour < 8 || hour >= 18) {
      throw new InvalidVisitDateError('O horário da visita deve ser entre 08:00 e 18:00, de segunda a sábado.');
    }
  }

  // Visit completion (TASK-BACKEND-010)

  async completeVisit(visitId: string, input: CompleteVisitInput, userId: string, ongId: string): Promise<void> {
    let adoptionRequestId: string;

    await db.transaction(async (trx) => {
      const visit = await adoptionRequestsRepository.findVisitForCompletion(visitId, ongId, trx);

      if (!visit) {
        const existingVisit = await adoptionRequestsRepository.findVisitById(visitId);
        if (existingVisit && existingVisit.ong_id !== ongId) {
          throw new VisitOngMismatchError();
        }
        throw new VisitNotFoundError();
      }

      if (visit.status === 'completed') {
        throw new VisitAlreadyCompletedError();
      }
      if (visit.status === 'cancelled') {
        throw new VisitCancelledError();
      }

      const completedAt = new Date(input.completed_at);
      const now = new Date();

      if (completedAt > now) {
        throw new InvalidCompletionDateError('A data de realização não pode ser no futuro.');
      }

      const visitDate = new Date(visit.visit_date);
      if (completedAt < visitDate) {
        throw new InvalidCompletionDateError('A data de realização não pode ser anterior à data do agendamento.');
      }

      await adoptionRequestsRepository.completeVisit(visitId, {
        completed_at: input.completed_at,
        completed_by: userId,
        evaluation: input.evaluation,
        observations: input.observations,
      }, trx);

      adoptionRequestId = visit.adoption_request_id;
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'visit_completed',
      entity: 'visit',
      entity_id: visitId,
      metadata: { evaluation: input.evaluation, adoption_request_id: adoptionRequestId! },
    });
  }

  async getVisitDetail(visitId: string, userId: string, role: string, ongId: string | null): Promise<VisitDetailVolunteer | VisitDetailAdopter> {
    if (role === 'ong_volunteer' || role === 'ong_admin') {
      const visit = await adoptionRequestsRepository.findVisitDetailFull(visitId);
      if (!visit) {
        throw new VisitNotFoundError();
      }
      if (visit.ong_id !== ongId) {
        throw new VisitNotFoundError();
      }
      return visit;
    }

    const visit = await adoptionRequestsRepository.findVisitDetailForAdopter(visitId, userId);
    if (!visit) {
      throw new VisitNotFoundError();
    }
    return visit;
  }
}

export const adoptionRequestsService = new AdoptionRequestsService();
