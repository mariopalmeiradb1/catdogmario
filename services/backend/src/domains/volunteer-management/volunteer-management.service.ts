import { volunteerManagementRepository } from './volunteer-management.repository';
import type {
  VolunteerProfile,
  VolunteerListItem,
  CreateVolunteerInput,
  UpdateVolunteerInput,
  VolunteerListFilters,
} from './volunteer-management.types';
import {
  VolunteerNotFoundError,
  VolunteerEmailAlreadyExistsError,
  VolunteerCpfAlreadyExistsError,
  InvalidVolunteerCpfError,
  UnderageVolunteerError,
  VolunteerAlreadyInactiveError,
  VolunteerAlreadyActiveError,
} from './volunteer-management.errors';
import { hashPassword } from '~/shared/utils/hash.util';
import { isValidCpf, sanitizeCpf } from '~/shared/utils/cpf.util';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

export class VolunteerManagementService {
  async create(input: CreateVolunteerInput, ongId: string, adminUserId: string): Promise<{ id: string }> {
    const emailExists = await volunteerManagementRepository.findByEmail(input.email);
    if (emailExists) {
      throw new VolunteerEmailAlreadyExistsError();
    }

    const sanitizedCpf = sanitizeCpf(input.cpf);
    if (!isValidCpf(sanitizedCpf)) {
      throw new InvalidVolunteerCpfError();
    }

    const cpfExists = await volunteerManagementRepository.findByCpf(sanitizedCpf, ongId);
    if (cpfExists) {
      throw new VolunteerCpfAlreadyExistsError();
    }

    this.validateAge(input.birth_date);

    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);

    await volunteerManagementRepository.createUser({
      id: userId,
      name: input.name,
      email: input.email,
      password_hash: passwordHash,
      ong_id: ongId,
    });

    await volunteerManagementRepository.createProfile({
      id: profileId,
      user_id: userId,
      cpf: sanitizedCpf,
      rg: input.rg,
      birth_date: input.birth_date,
      phone: input.phone,
      zip_code: input.zip_code,
      street: input.street,
      number: input.number,
      complement: input.complement,
      neighborhood: input.neighborhood,
      city: input.city,
      state: input.state,
    });

    await recordAuditLog({
      user_id: adminUserId,
      ong_id: ongId,
      action: 'volunteer.create',
      entity: 'volunteer',
      entity_id: userId,
    });

    return { id: userId };
  }

  async getDetail(userId: string, ongId: string): Promise<VolunteerProfile> {
    const volunteer = await volunteerManagementRepository.findById(userId, ongId);
    if (!volunteer) {
      throw new VolunteerNotFoundError();
    }
    return volunteer;
  }

  async update(userId: string, input: UpdateVolunteerInput, ongId: string, adminUserId: string): Promise<VolunteerProfile> {
    const volunteer = await volunteerManagementRepository.findById(userId, ongId);
    if (!volunteer) {
      throw new VolunteerNotFoundError();
    }

    if (input.birth_date) {
      this.validateAge(input.birth_date);
    }

    await volunteerManagementRepository.update(userId, input);

    await recordAuditLog({
      user_id: adminUserId,
      ong_id: ongId,
      action: 'volunteer.update',
      entity: 'volunteer',
      entity_id: userId,
    });

    return (await volunteerManagementRepository.findById(userId, ongId))!;
  }

  async deactivate(userId: string, ongId: string, adminUserId: string): Promise<void> {
    const volunteer = await volunteerManagementRepository.findById(userId, ongId);
    if (!volunteer) {
      throw new VolunteerNotFoundError();
    }
    if (!volunteer.is_active) {
      throw new VolunteerAlreadyInactiveError();
    }

    await volunteerManagementRepository.deactivate(userId);

    await recordAuditLog({
      user_id: adminUserId,
      ong_id: ongId,
      action: 'volunteer.deactivate',
      entity: 'volunteer',
      entity_id: userId,
    });
  }

  async reactivate(userId: string, ongId: string, adminUserId: string): Promise<void> {
    const volunteer = await volunteerManagementRepository.findById(userId, ongId);
    if (!volunteer) {
      throw new VolunteerNotFoundError();
    }
    if (volunteer.is_active) {
      throw new VolunteerAlreadyActiveError();
    }

    await volunteerManagementRepository.reactivate(userId);

    await recordAuditLog({
      user_id: adminUserId,
      ong_id: ongId,
      action: 'volunteer.reactivate',
      entity: 'volunteer',
      entity_id: userId,
    });
  }

  async remove(userId: string, ongId: string, adminUserId: string): Promise<void> {
    const volunteer = await volunteerManagementRepository.findById(userId, ongId);
    if (!volunteer) {
      throw new VolunteerNotFoundError();
    }

    await volunteerManagementRepository.softDelete(userId);

    await recordAuditLog({
      user_id: adminUserId,
      ong_id: ongId,
      action: 'volunteer.remove',
      entity: 'volunteer',
      entity_id: userId,
    });
  }

  async list(ongId: string, filters: VolunteerListFilters): Promise<{ data: VolunteerListItem[]; total: number; page: number; limit: number }> {
    const { data, total } = await volunteerManagementRepository.list(ongId, filters);
    return { data, total, page: filters.page, limit: filters.limit };
  }

  private validateAge(birthDateStr: string): void {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new UnderageVolunteerError();
    }
  }
}

export const volunteerManagementService = new VolunteerManagementService();
