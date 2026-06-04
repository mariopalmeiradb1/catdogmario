import { db } from '~/config/database';
import { followUpRepository } from './follow-up.repository';
import type {
  RegisterContactInput,
  EditContactInput,
  FollowUpContactDetail,
  AdoptionTimeline,
  TimelineEntry,
  ContactStatus,
  FollowUpListFilters,
  FollowUpListItem,
  ReminderForContact,
} from './follow-up.types';
import {
  ReminderNotFoundError,
  ReminderNotPendingError,
  ContactAlreadyRegisteredError,
  InvalidContactDateError,
  ContactNotFoundError,
  InsufficientPermissionError,
} from './follow-up.errors';
import { recordAuditLog } from '~/shared/services/audit-log.shared';

export class FollowUpService {
  async registerContact(
    reminderId: string,
    input: RegisterContactInput,
    userId: string,
    ongId: string,
  ): Promise<FollowUpContactDetail> {
    const reminder = await followUpRepository.findReminderForContact(reminderId, ongId);
    if (!reminder) {
      throw new ReminderNotFoundError();
    }

    this.validateReminderStatus(reminder);

    const hasContact = await followUpRepository.hasContactForReminder(reminderId);
    if (hasContact) {
      throw new ContactAlreadyRegisteredError();
    }

    this.validateContactDate(input.contact_date, reminder.adoption_date);

    const contactId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      await followUpRepository.createContact(
        {
          id: contactId,
          reminder_id: reminderId,
          registered_by: userId,
          ong_id: ongId,
          contact_date: input.contact_date,
          status: input.status,
          observation: input.observation,
        },
        trx,
      );
      await followUpRepository.updateReminderStatus(reminderId, 'completed', trx);
    });

    if (input.status === 'no_response') {
      await this.notifyAdminsNoResponse(userId, ongId, contactId, reminder);
    }

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'follow_up.contact_registered',
      entity: 'follow_up_contact',
      entity_id: contactId,
      metadata: { reminder_id: reminderId, status: input.status },
    });

    const contact = await followUpRepository.findContactById(contactId, ongId);
    return contact!;
  }

  async editContact(
    contactId: string,
    input: EditContactInput,
    userId: string,
    ongId: string,
    role: string,
  ): Promise<FollowUpContactDetail> {
    if (role !== 'ong_admin') {
      throw new InsufficientPermissionError();
    }

    const contact = await followUpRepository.findContactById(contactId, ongId);
    if (!contact) {
      throw new ContactNotFoundError();
    }

    const previousObservation = contact.observation.substring(0, 100);
    await followUpRepository.updateContactObservation(contactId, input.observation, new Date());

    await recordAuditLog({
      user_id: userId,
      ong_id: ongId,
      action: 'follow_up.contact_edited',
      entity: 'follow_up_contact',
      entity_id: contactId,
      metadata: { contact_id: contactId, previous_observation: previousObservation },
    });

    const updated = await followUpRepository.findContactById(contactId, ongId);
    return updated!;
  }

  async getAdoptionTimeline(adoptionRequestId: string, ongId: string): Promise<AdoptionTimeline> {
    const { adoptionInfo, entries } = await followUpRepository.getTimelineByAdoption(adoptionRequestId, ongId);

    if (!adoptionInfo || entries.length === 0) {
      throw new ReminderNotFoundError();
    }

    const timelineEntries: TimelineEntry[] = entries.map((entry) => ({
      reminder_id: entry.reminder_id,
      reminder_number: entry.reminder_number,
      due_date: entry.due_date,
      reminder_status: entry.reminder_status,
      contact: entry.contact_id
        ? {
            id: entry.contact_id,
            contact_date: entry.contact_date!,
            status: entry.contact_status as ContactStatus,
            observation: entry.contact_observation!,
            registered_by_name: entry.registered_by_name!,
            created_at: entry.contact_created_at!,
          }
        : null,
    }));

    const isComplete = timelineEntries.every((e) => e.reminder_status === 'completed');

    const hasNoResponsePattern = this.detectNoResponsePattern(timelineEntries);

    return {
      adoption_request_id: adoptionInfo.adoption_request_id,
      animal_name: adoptionInfo.animal_name,
      adopter_name: adoptionInfo.adopter_name,
      adopter_phone: adoptionInfo.adopter_phone,
      adopter_email: adoptionInfo.adopter_email,
      adoption_date: adoptionInfo.adoption_date,
      is_complete: isComplete,
      has_no_response_pattern: hasNoResponsePattern,
      entries: timelineEntries,
    };
  }

  async list(
    ongId: string,
    filters: FollowUpListFilters,
  ): Promise<{ data: FollowUpListItem[]; pagination: { page: number; limit: number; total: number } }> {
    const { items, total } = await followUpRepository.list(ongId, filters);
    return {
      data: items,
      pagination: { page: filters.page, limit: filters.limit, total },
    };
  }

  private detectNoResponsePattern(entries: TimelineEntry[]): boolean {
    let consecutiveNoResponse = 0;
    for (const entry of entries) {
      if (entry.contact && entry.contact.status === 'no_response') {
        consecutiveNoResponse++;
        if (consecutiveNoResponse >= 2) return true;
      } else {
        consecutiveNoResponse = 0;
      }
    }
    return false;
  }

  private validateReminderStatus(reminder: ReminderForContact): void {
    if (reminder.status === 'completed') {
      throw new ReminderNotPendingError('Este acompanhamento já foi registrado.');
    }
    if (reminder.status === 'cancelled') {
      throw new ReminderNotPendingError('Não é possível registrar contato para um acompanhamento cancelado.');
    }
    if (reminder.status !== 'pending' && reminder.status !== 'overdue') {
      throw new ReminderNotPendingError('Este lembrete não está em um status válido para registro.');
    }
  }

  private validateContactDate(contactDate: string, adoptionDate: string): void {
    const today = new Date().toISOString().split('T')[0];
    if (contactDate > today) {
      throw new InvalidContactDateError('A data do contato não pode ser posterior a hoje.');
    }
    if (adoptionDate && contactDate < adoptionDate) {
      throw new InvalidContactDateError(
        `A data do contato não pode ser anterior à data de adoção (${adoptionDate}).`,
      );
    }
  }

  private async notifyAdminsNoResponse(
    userId: string,
    ongId: string,
    contactId: string,
    reminder: ReminderForContact,
  ): Promise<void> {
    const admins = await followUpRepository.findAdminsByOngId(ongId);
    for (const admin of admins) {
      await recordAuditLog({
        user_id: userId,
        ong_id: ongId,
        action: 'follow_up.contact_no_response_notification',
        entity: 'follow_up_contact',
        entity_id: contactId,
        metadata: {
          admin_id: admin.id,
          animal_name: reminder.animal_name,
          adopter_name: reminder.adopter_name,
        },
      });
    }
  }
}

export const followUpService = new FollowUpService();
