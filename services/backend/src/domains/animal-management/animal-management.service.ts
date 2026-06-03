import { animalManagementRepository } from './animal-management.repository';
import {
  CreateAnimalInput,
  CreateAnimalResult,
  UpdateAnimalInput,
  AnimalDetail,
  AnimalListFilters,
  AnimalMedia,
  AnimalStatus,
  VALID_TRANSITIONS,
  StatusTransitionResult,
  ConfirmAdoptionResult,
  StatusHistoryEntry,
} from './animal-management.types';
import {
  OngNotApprovedError,
  AnimalNotFoundError,
  AnimalNotEditableError,
  ConcurrencyConflictError,
  CannotInactivateError,
  MediaLimitExceededError,
  InvalidStatusTransitionError,
} from './animal-management.errors';
import { recordAuditLog } from '~/shared/services/audit-log.shared';
import { fileStorage } from '~/shared/services/file-storage.service';
import { db } from '~/config/database';
import { adoptionRequestsService } from '~/domains/adoption-requests/adoption-requests.service';

const EDITABLE_STATUSES = ['available', 'in_adoption_process'];
const INACTIVATABLE_STATUSES = ['available', 'adopted'];

const COMPARABLE_FIELDS = [
  'name', 'species', 'breed', 'sex', 'castration', 'temperament',
  'estimated_age_category', 'size', 'weight_kg', 'height_cm', 'length_cm',
  'special_needs', 'special_needs_description', 'rescue_observations', 'general_observations',
] as const;

function normalizeValue(value: unknown): unknown {
  if (value === undefined || value === '') return null;
  return value;
}

function computeChangedFields(
  current: Record<string, unknown>,
  input: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const field of COMPARABLE_FIELDS) {
    let oldVal = current[field];
    let newVal = input[field];

    if (field === 'temperament') {
      const oldArr = typeof oldVal === 'string' ? JSON.parse(oldVal as string) : (oldVal || []);
      const newArr = Array.isArray(newVal) ? newVal : [];
      const oldSorted = JSON.stringify([...(oldArr as string[])].sort());
      const newSorted = JSON.stringify([...(newArr as string[])].sort());
      if (oldSorted !== newSorted) {
        changes[field] = { old: oldArr, new: newArr };
      }
      continue;
    }

    oldVal = normalizeValue(oldVal);
    newVal = normalizeValue(newVal);

    if (field === 'weight_kg' || field === 'height_cm' || field === 'length_cm') {
      const oldNum = oldVal != null ? Number(oldVal) : null;
      const newNum = newVal != null ? Number(newVal) : null;
      if (oldNum !== newNum) {
        changes[field] = { old: oldNum, new: newNum };
      }
      continue;
    }

    if (field === 'special_needs') {
      const oldBool = !!oldVal;
      const newBool = !!newVal;
      if (oldBool !== newBool) {
        changes[field] = { old: oldBool, new: newBool };
      }
      continue;
    }

    if (oldVal !== newVal) {
      changes[field] = { old: oldVal, new: newVal };
    }
  }

  return changes;
}

export class AnimalManagementService {
  async create(input: CreateAnimalInput, userId: string, ongId: string): Promise<CreateAnimalResult> {
    const ongStatus = await animalManagementRepository.findOngStatus(ongId);

    if (ongStatus !== 'approved') {
      throw new OngNotApprovedError();
    }

    const duplicateWarning = await animalManagementRepository.findDuplicate(
      ongId,
      input.name,
      input.species,
      input.breed,
    );

    const id = crypto.randomUUID();

    const data = await animalManagementRepository.create({
      ...input,
      id,
      ong_id: ongId,
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.create',
      entity: 'animal',
      entity_id: id,
    });

    return { data, duplicateWarning };
  }

  async list(ongId: string, filters: AnimalListFilters): Promise<{ data: AnimalDetail[]; pagination: { page: number; limit: number; total: number } }> {
    const { items, total } = await animalManagementRepository.list(ongId, filters);
    return {
      data: items as unknown as AnimalDetail[],
      pagination: { page: filters.page, limit: filters.limit, total },
    };
  }

  async findById(id: string, ongId: string): Promise<AnimalDetail> {
    const animal = await animalManagementRepository.findByIdWithMedia(id, ongId);
    if (!animal) throw new AnimalNotFoundError();
    return animal;
  }

  async update(id: string, input: UpdateAnimalInput, userId: string, ongId: string): Promise<AnimalDetail> {
    const current = await animalManagementRepository.findById(id, ongId);
    if (!current) throw new AnimalNotFoundError();

    if (!EDITABLE_STATUSES.includes(current.status)) {
      throw new AnimalNotEditableError();
    }

    const currentUpdatedAt = new Date(current.updated_at).getTime();
    const inputUpdatedAt = new Date(input.updated_at).getTime();
    if (currentUpdatedAt !== inputUpdatedAt) {
      throw new ConcurrencyConflictError();
    }

    const changedFields = computeChangedFields(
      current as unknown as Record<string, unknown>,
      input as unknown as Record<string, unknown>,
    );

    if (Object.keys(changedFields).length === 0) {
      const detail = await animalManagementRepository.findByIdWithMedia(id, ongId);
      return detail!;
    }

    const updateFields: Record<string, unknown> = {
      name: input.name,
      species: input.species,
      breed: input.breed,
      sex: input.sex,
      castration: input.castration,
      temperament: JSON.stringify(input.temperament),
      estimated_age_category: input.estimated_age_category,
      size: input.size || null,
      weight_kg: input.weight_kg ?? null,
      height_cm: input.height_cm ?? null,
      length_cm: input.length_cm ?? null,
      special_needs: input.special_needs ?? false,
      special_needs_description: input.special_needs_description || null,
      rescue_observations: input.rescue_observations || null,
      general_observations: input.general_observations || null,
    };

    await animalManagementRepository.update(id, updateFields);

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.update',
      entity: 'animal',
      entity_id: id,
      metadata: { changed_fields: changedFields },
    });

    const detail = await animalManagementRepository.findByIdWithMedia(id, ongId);
    return detail!;
  }

  async inactivate(id: string, userId: string, ongId: string): Promise<{ id: string; status: string; inactivated_at: string }> {
    const current = await animalManagementRepository.findById(id, ongId);
    if (!current) throw new AnimalNotFoundError();

    if (!INACTIVATABLE_STATUSES.includes(current.status)) {
      throw new CannotInactivateError();
    }

    await animalManagementRepository.inactivate(id);

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.inactivate',
      entity: 'animal',
      entity_id: id,
    });

    return { id, status: 'inactive', inactivated_at: new Date().toISOString() };
  }

  async uploadMedia(
    id: string,
    file: Express.Multer.File,
    type: 'photo' | 'video',
    userId: string,
    ongId: string,
  ): Promise<AnimalMedia> {
    const current = await animalManagementRepository.findById(id, ongId);
    if (!current) throw new AnimalNotFoundError();

    if (!EDITABLE_STATUSES.includes(current.status)) {
      throw new AnimalNotEditableError();
    }

    const count = await animalManagementRepository.countMedia(id, type);
    const limit = type === 'photo' ? 3 : 1;
    if (count >= limit) {
      throw new MediaLimitExceededError(type);
    }

    const url = await fileStorage.save(file);
    const sortOrder = await animalManagementRepository.getNextMediaSortOrder(id, type);

    const media = await animalManagementRepository.createMedia({
      id: crypto.randomUUID(),
      animal_id: id,
      type,
      url,
      original_name: file.originalname,
      size_bytes: file.size,
      mime_type: file.mimetype,
      sort_order: sortOrder,
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.media.add',
      entity: 'animal',
      entity_id: id,
      metadata: { media_id: media.id, media_type: type },
    });

    return media;
  }

  async removeMedia(id: string, mediaId: string, userId: string, ongId: string): Promise<void> {
    const current = await animalManagementRepository.findById(id, ongId);
    if (!current) throw new AnimalNotFoundError();

    if (!EDITABLE_STATUSES.includes(current.status)) {
      throw new AnimalNotEditableError();
    }

    const media = await animalManagementRepository.findMediaById(mediaId);
    if (!media || media.animal_id !== id) {
      throw new AnimalNotFoundError();
    }

    await fileStorage.remove(media.url);
    await animalManagementRepository.deleteMedia(mediaId);

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.media.remove',
      entity: 'animal',
      entity_id: id,
      metadata: { media_id: mediaId, media_type: media.type },
    });
  }

  private validateTransition(fromStatus: AnimalStatus, toStatus: AnimalStatus): void {
    if (!VALID_TRANSITIONS[fromStatus].includes(toStatus)) {
      throw new InvalidStatusTransitionError(fromStatus, toStatus);
    }
  }

  async startAdoptionProcess(id: string, userId: string, ongId: string): Promise<StatusTransitionResult> {
    const result = await db.transaction(async (trx) => {
      const current = await animalManagementRepository.findByIdForUpdate(id, ongId, trx);
      if (!current) throw new AnimalNotFoundError();

      this.validateTransition(current.status as AnimalStatus, 'in_adoption_process');

      await animalManagementRepository.updateStatus(id, 'in_adoption_process', null, trx);

      const historyEntry: StatusHistoryEntry = {
        id: crypto.randomUUID(),
        animal_id: id,
        from_status: current.status as AnimalStatus,
        to_status: 'in_adoption_process',
        trigger_type: 'automatic',
        trigger_reason: 'visit_scheduled',
        triggered_by: userId,
      };
      await animalManagementRepository.createStatusHistory(historyEntry, trx);

      return { from_status: current.status };
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.status.start_adoption_process',
      entity: 'animal',
      entity_id: id,
      metadata: { from_status: result.from_status, to_status: 'in_adoption_process' },
    });

    return { id, status: 'in_adoption_process', updated_at: new Date().toISOString() };
  }

  async revertToAvailable(id: string, userId: string, ongId: string): Promise<StatusTransitionResult> {
    const result = await db.transaction(async (trx) => {
      const current = await animalManagementRepository.findByIdForUpdate(id, ongId, trx);
      if (!current) throw new AnimalNotFoundError();

      if (current.status !== 'in_adoption_process') {
        throw new InvalidStatusTransitionError(current.status, 'available');
      }

      await animalManagementRepository.updateStatus(id, 'available', null, trx);

      const historyEntry: StatusHistoryEntry = {
        id: crypto.randomUUID(),
        animal_id: id,
        from_status: current.status as AnimalStatus,
        to_status: 'available',
        trigger_type: 'automatic',
        trigger_reason: 'all_visits_cancelled',
        triggered_by: userId,
      };
      await animalManagementRepository.createStatusHistory(historyEntry, trx);

      return { from_status: current.status };
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.status.revert_to_available',
      entity: 'animal',
      entity_id: id,
      metadata: { from_status: result.from_status, to_status: 'available' },
    });

    return { id, status: 'available', updated_at: new Date().toISOString() };
  }

  async confirmAdoption(id: string, userId: string, ongId: string, termNumber: string): Promise<ConfirmAdoptionResult> {
    const adoptedAt = new Date();

    await db.transaction(async (trx) => {
      const current = await animalManagementRepository.findByIdForUpdate(id, ongId, trx);
      if (!current) throw new AnimalNotFoundError();

      this.validateTransition(current.status as AnimalStatus, 'adopted');

      await animalManagementRepository.updateStatus(
        id,
        'adopted',
        { responsibility_term_number: termNumber, adopted_at: adoptedAt },
        trx,
      );

      const historyEntry: StatusHistoryEntry = {
        id: crypto.randomUUID(),
        animal_id: id,
        from_status: current.status as AnimalStatus,
        to_status: 'adopted',
        trigger_type: 'manual',
        trigger_reason: 'adoption_confirmed',
        triggered_by: userId,
        metadata: { responsibility_term_number: termNumber },
      };
      await animalManagementRepository.createStatusHistory(historyEntry, trx);

      await adoptionRequestsService.autoCloseByAnimal(id, ongId, userId, trx);
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'animal.status.confirm_adoption',
      entity: 'animal',
      entity_id: id,
      metadata: { to_status: 'adopted', responsibility_term_number: termNumber },
    });

    return {
      id,
      status: 'adopted',
      adopted_at: adoptedAt.toISOString(),
      responsibility_term_number: termNumber,
    };
  }
}

export const animalManagementService = new AnimalManagementService();
