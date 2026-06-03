import { adopterManagementRepository } from './adopter-management.repository';
import type { AdopterProfile, AdopterProfileMaskedView, CreateAdopterProfileInput, UpdateAdopterProfileInput } from './adopter-management.types';
import {
  AdopterProfileAlreadyExistsError,
  AdopterProfileNotFoundError,
  CpfAlreadyRegisteredError,
  InvalidCpfError,
  UnauthorizedProfileAccessError,
  UnderageAdopterError,
} from './adopter-management.errors';
import { isValidCpf, sanitizeCpf } from '~/shared/utils/cpf.util';
import { maskCpf, maskRg } from '~/shared/utils/data-masking.util';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

export class AdopterManagementService {
  async create(input: CreateAdopterProfileInput, userId: string): Promise<AdopterProfile> {
    const existingProfile = await adopterManagementRepository.findByUserId(userId);
    if (existingProfile) {
      throw new AdopterProfileAlreadyExistsError();
    }

    const sanitizedCpf = sanitizeCpf(input.cpf);
    if (!isValidCpf(sanitizedCpf)) {
      throw new InvalidCpfError();
    }

    const cpfExists = await adopterManagementRepository.findByCpf(sanitizedCpf);
    if (cpfExists) {
      throw new CpfAlreadyRegisteredError();
    }

    this.validateAge(input.birth_date);

    const id = crypto.randomUUID();
    const profile = await adopterManagementRepository.create({
      id,
      user_id: userId,
      ...input,
      cpf: sanitizedCpf,
    });

    await recordAuditLog({
      user_id: userId,
      ong_id: 'system',
      action: 'adopter_profile.create',
      entity: 'adopter_profile',
      entity_id: id,
    });

    return profile;
  }

  async getMyProfile(userId: string): Promise<AdopterProfile> {
    const profile = await adopterManagementRepository.findByUserId(userId);
    if (!profile) {
      throw new AdopterProfileNotFoundError();
    }
    return profile;
  }

  async updateMyProfile(userId: string, input: UpdateAdopterProfileInput): Promise<AdopterProfile> {
    const existingProfile = await adopterManagementRepository.findByUserId(userId);
    if (!existingProfile) {
      throw new AdopterProfileNotFoundError();
    }

    if (input.birth_date) {
      this.validateAge(input.birth_date);
    }

    const changes = this.detectChanges(existingProfile, input);

    const profile = await adopterManagementRepository.update(userId, input);

    await recordAuditLog({
      user_id: userId,
      ong_id: 'system',
      action: 'adopter_profile.update',
      entity: 'adopter_profile',
      entity_id: existingProfile.id,
      metadata: { changes },
    });

    return profile;
  }

  private detectChanges(
    existing: AdopterProfile,
    input: UpdateAdopterProfileInput,
  ): Array<{ field: string; old_value: unknown; new_value: unknown }> {
    const changes: Array<{ field: string; old_value: unknown; new_value: unknown }> = [];

    for (const [key, newValue] of Object.entries(input)) {
      if (newValue === undefined) continue;
      const oldValue = existing[key as keyof AdopterProfile];
      if (String(oldValue ?? '') !== String(newValue ?? '')) {
        changes.push({ field: key, old_value: oldValue ?? null, new_value: newValue });
      }
    }

    return changes;
  }

  async getProfileForVolunteer(adopterId: string, ongId: string): Promise<AdopterProfileMaskedView> {
    const profile = await adopterManagementRepository.findById(adopterId);
    if (!profile) {
      throw new AdopterProfileNotFoundError();
    }

    const hasRequest = await adopterManagementRepository.hasAdoptionRequestInOng(profile.user_id, ongId);
    if (!hasRequest) {
      throw new UnauthorizedProfileAccessError();
    }

    return {
      ...profile,
      cpf: maskCpf(profile.cpf),
      rg: maskRg(profile.rg),
    };
  }

  private validateAge(birthDate: string): void {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new UnderageAdopterError();
    }
  }
}

export const adopterManagementService = new AdopterManagementService();
