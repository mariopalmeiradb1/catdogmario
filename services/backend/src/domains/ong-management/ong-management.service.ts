import { ongManagementRepository } from './ong-management.repository';
import { OngDetail, OngListFilters, PaginatedResponse, OngListItem, UpdateOngInput, UpdateOngAdminInput } from './ong-management.types';
import { OngNotFoundError, InvalidOngStatusTransitionError, CnpjDuplicateError } from './ong-management.errors';

export class OngManagementService {
  async list(filters: OngListFilters): Promise<PaginatedResponse<OngListItem>> {
    const { items, total } = await ongManagementRepository.findAll(filters);
    return { data: items, total, page: filters.page, limit: filters.limit };
  }

  async getDetail(id: string): Promise<OngDetail> {
    const ong = await ongManagementRepository.findById(id);
    if (!ong) {
      throw new OngNotFoundError();
    }
    return ong;
  }

  async getMyOngDetail(userId: string): Promise<OngDetail> {
    const ong = await ongManagementRepository.findOngByUserId(userId);
    if (!ong) {
      throw new OngNotFoundError();
    }
    return ong;
  }

  async approve(ongId: string): Promise<void> {
    const ong = await ongManagementRepository.findById(ongId);
    if (!ong) {
      throw new OngNotFoundError();
    }
    if (ong.status !== 'pending') {
      throw new InvalidOngStatusTransitionError();
    }
    await ongManagementRepository.updateStatus(ongId, 'approved');
  }

  async reject(ongId: string): Promise<void> {
    const ong = await ongManagementRepository.findById(ongId);
    if (!ong) {
      throw new OngNotFoundError();
    }
    if (ong.status !== 'pending') {
      throw new InvalidOngStatusTransitionError();
    }
    await ongManagementRepository.updateStatus(ongId, 'rejected', { rejected_at: new Date() });
  }

  async deactivate(ongId: string): Promise<void> {
    const ong = await ongManagementRepository.findById(ongId);
    if (!ong) {
      throw new OngNotFoundError();
    }
    if (ong.status !== 'approved') {
      throw new InvalidOngStatusTransitionError();
    }
    await ongManagementRepository.updateStatus(ongId, 'inactive', { deactivated_at: new Date() });
  }

  async reactivate(ongId: string): Promise<void> {
    const ong = await ongManagementRepository.findById(ongId);
    if (!ong) {
      throw new OngNotFoundError();
    }
    if (ong.status !== 'inactive') {
      throw new InvalidOngStatusTransitionError();
    }
    await ongManagementRepository.updateStatus(ongId, 'approved', { deactivated_at: null });
  }

  async updateByOngAdmin(userId: string, data: UpdateOngInput): Promise<OngDetail> {
    const ong = await ongManagementRepository.findOngByUserId(userId);
    if (!ong) {
      throw new OngNotFoundError();
    }

    if (ong.status !== 'approved') {
      throw new InvalidOngStatusTransitionError();
    }

    await ongManagementRepository.updateOngData(ong.id, data);
    const updated = await ongManagementRepository.findById(ong.id);
    return updated!;
  }

  async updateBySystemAdmin(ongId: string, data: UpdateOngAdminInput): Promise<OngDetail> {
    const ong = await ongManagementRepository.findById(ongId);
    if (!ong) {
      throw new OngNotFoundError();
    }

    if (data.cnpj && data.cnpj !== ong.cnpj) {
      const existing = await ongManagementRepository.findOngByCnpjExcluding(data.cnpj, ongId);
      if (existing) {
        throw new CnpjDuplicateError();
      }
    }

    await ongManagementRepository.updateOngData(ongId, data);
    const updated = await ongManagementRepository.findById(ongId);
    return updated!;
  }
}

export const ongManagementService = new OngManagementService();
