import { FollowUpService } from '~/domains/follow-up/follow-up.service';
import { followUpRepository } from '~/domains/follow-up/follow-up.repository';
import { db } from '~/config/database';
import {
  ReminderNotFoundError,
  ReminderNotPendingError,
  ContactAlreadyRegisteredError,
  InvalidContactDateError,
  ContactNotFoundError,
  InsufficientPermissionError,
} from '~/domains/follow-up/follow-up.errors';

jest.mock('~/domains/follow-up/follow-up.repository');
jest.mock('~/config/database');
jest.mock('~/shared/services/audit-log.shared', () => ({
  recordAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const mockRepository = followUpRepository as jest.Mocked<typeof followUpRepository>;
const mockDb = db as jest.MockedFunction<typeof db>;

describe('FollowUpService', () => {
  let service: FollowUpService;

  beforeEach(() => {
    service = new FollowUpService();
    jest.clearAllMocks();
  });

  describe('registerContact', () => {
    const validInput = {
      contact_date: '2026-06-01',
      status: 'positive' as const,
      observation: 'Animal adaptado com sucesso.',
    };

    it('should throw ReminderNotFoundError when reminder not found', async () => {
      mockRepository.findReminderForContact.mockResolvedValue(null);

      await expect(
        service.registerContact('reminder-id', validInput, 'user-id', 'ong-id'),
      ).rejects.toThrow(ReminderNotFoundError);
    });

    it('should throw ReminderNotPendingError when reminder is completed', async () => {
      mockRepository.findReminderForContact.mockResolvedValue({
        id: 'reminder-id',
        status: 'completed',
        ong_id: 'ong-id',
        adoption_date: '2026-05-01',
        animal_name: 'Rex',
        adopter_name: 'Maria',
      });

      await expect(
        service.registerContact('reminder-id', validInput, 'user-id', 'ong-id'),
      ).rejects.toThrow(ReminderNotPendingError);
    });

    it('should throw ReminderNotPendingError when reminder is cancelled', async () => {
      mockRepository.findReminderForContact.mockResolvedValue({
        id: 'reminder-id',
        status: 'cancelled',
        ong_id: 'ong-id',
        adoption_date: '2026-05-01',
        animal_name: 'Rex',
        adopter_name: 'Maria',
      });

      await expect(
        service.registerContact('reminder-id', validInput, 'user-id', 'ong-id'),
      ).rejects.toThrow(ReminderNotPendingError);
    });

    it('should throw ContactAlreadyRegisteredError when contact already exists', async () => {
      mockRepository.findReminderForContact.mockResolvedValue({
        id: 'reminder-id',
        status: 'pending',
        ong_id: 'ong-id',
        adoption_date: '2026-05-01',
        animal_name: 'Rex',
        adopter_name: 'Maria',
      });
      mockRepository.hasContactForReminder.mockResolvedValue(true);

      await expect(
        service.registerContact('reminder-id', validInput, 'user-id', 'ong-id'),
      ).rejects.toThrow(ContactAlreadyRegisteredError);
    });

    it('should throw InvalidContactDateError when date is in the future', async () => {
      mockRepository.findReminderForContact.mockResolvedValue({
        id: 'reminder-id',
        status: 'pending',
        ong_id: 'ong-id',
        adoption_date: '2026-05-01',
        animal_name: 'Rex',
        adopter_name: 'Maria',
      });
      mockRepository.hasContactForReminder.mockResolvedValue(false);

      const futureInput = { ...validInput, contact_date: '2027-12-31' };

      await expect(
        service.registerContact('reminder-id', futureInput, 'user-id', 'ong-id'),
      ).rejects.toThrow(InvalidContactDateError);
    });

    it('should throw InvalidContactDateError when date is before adoption', async () => {
      mockRepository.findReminderForContact.mockResolvedValue({
        id: 'reminder-id',
        status: 'pending',
        ong_id: 'ong-id',
        adoption_date: '2026-05-01',
        animal_name: 'Rex',
        adopter_name: 'Maria',
      });
      mockRepository.hasContactForReminder.mockResolvedValue(false);

      const earlyInput = { ...validInput, contact_date: '2026-04-15' };

      await expect(
        service.registerContact('reminder-id', earlyInput, 'user-id', 'ong-id'),
      ).rejects.toThrow(InvalidContactDateError);
    });

    it('should create contact and update reminder in a transaction', async () => {
      mockRepository.findReminderForContact.mockResolvedValue({
        id: 'reminder-id',
        status: 'pending',
        ong_id: 'ong-id',
        adoption_date: '2026-05-01',
        animal_name: 'Rex',
        adopter_name: 'Maria',
      });
      mockRepository.hasContactForReminder.mockResolvedValue(false);

      const mockTrx = jest.fn();
      (mockDb as unknown as { transaction: jest.Mock }).transaction = jest.fn().mockImplementation(async (cb: (trx: unknown) => Promise<void>) => {
        await cb(mockTrx);
      });
      mockRepository.createContact.mockResolvedValue(undefined);
      mockRepository.updateReminderStatus.mockResolvedValue(undefined);
      mockRepository.findAdminsByOngId.mockResolvedValue([]);
      mockRepository.findContactById.mockResolvedValue({
        id: 'contact-id',
        reminder_id: 'reminder-id',
        registered_by: 'user-id',
        registered_by_name: 'Test User',
        ong_id: 'ong-id',
        contact_date: '2026-06-01',
        status: 'positive',
        observation: 'Animal adaptado com sucesso.',
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      });

      const result = await service.registerContact('reminder-id', validInput, 'user-id', 'ong-id');

      expect(result).toBeDefined();
      expect(mockRepository.createContact).toHaveBeenCalled();
      expect(mockRepository.updateReminderStatus).toHaveBeenCalledWith('reminder-id', 'completed', mockTrx);
    });
  });

  describe('editContact', () => {
    it('should throw InsufficientPermissionError when role is not ong_admin', async () => {
      await expect(
        service.editContact('contact-id', { observation: 'Nova observação' }, 'user-id', 'ong-id', 'ong_volunteer'),
      ).rejects.toThrow(InsufficientPermissionError);
    });

    it('should throw ContactNotFoundError when contact not found', async () => {
      mockRepository.findContactById.mockResolvedValue(null);

      await expect(
        service.editContact('contact-id', { observation: 'Nova observação' }, 'user-id', 'ong-id', 'ong_admin'),
      ).rejects.toThrow(ContactNotFoundError);
    });

    it('should update observation when admin edits', async () => {
      mockRepository.findContactById
        .mockResolvedValueOnce({
          id: 'contact-id',
          reminder_id: 'reminder-id',
          registered_by: 'user-id',
          registered_by_name: 'Test User',
          ong_id: 'ong-id',
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Observação original aqui.',
          created_at: '2026-06-01T00:00:00.000Z',
          updated_at: '2026-06-01T00:00:00.000Z',
        })
        .mockResolvedValueOnce({
          id: 'contact-id',
          reminder_id: 'reminder-id',
          registered_by: 'user-id',
          registered_by_name: 'Test User',
          ong_id: 'ong-id',
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Observação atualizada pelo admin.',
          created_at: '2026-06-01T00:00:00.000Z',
          updated_at: '2026-06-03T00:00:00.000Z',
        });
      mockRepository.updateContactObservation.mockResolvedValue(undefined);

      const result = await service.editContact(
        'contact-id',
        { observation: 'Observação atualizada pelo admin.' },
        'admin-id',
        'ong-id',
        'ong_admin',
      );

      expect(result.observation).toBe('Observação atualizada pelo admin.');
      expect(mockRepository.updateContactObservation).toHaveBeenCalledWith(
        'contact-id',
        'Observação atualizada pelo admin.',
        expect.any(Date),
      );
    });
  });

  describe('getAdoptionTimeline', () => {
    it('should throw ReminderNotFoundError when no entries found', async () => {
      mockRepository.getTimelineByAdoption.mockResolvedValue({
        adoptionInfo: null,
        entries: [],
      });

      await expect(service.getAdoptionTimeline('request-id', 'ong-id')).rejects.toThrow(
        ReminderNotFoundError,
      );
    });

    it('should calculate is_complete correctly', async () => {
      mockRepository.getTimelineByAdoption.mockResolvedValue({
        adoptionInfo: {
          adoption_request_id: 'request-id',
          animal_name: 'Rex',
          adopter_name: 'Maria',
          adopter_phone: null,
          adopter_email: 'maria@test.com',
          adoption_date: '2026-05-01',
        },
        entries: [
          { reminder_id: 'r1', reminder_number: 1, due_date: '2026-05-31', reminder_status: 'completed', contact_id: 'c1', contact_date: '2026-06-01', contact_status: 'positive', contact_observation: 'Ok', registered_by_name: 'João', contact_created_at: '2026-06-01T00:00:00.000Z' },
          { reminder_id: 'r2', reminder_number: 2, due_date: '2026-06-30', reminder_status: 'completed', contact_id: 'c2', contact_date: '2026-07-01', contact_status: 'positive', contact_observation: 'Ok', registered_by_name: 'João', contact_created_at: '2026-07-01T00:00:00.000Z' },
          { reminder_id: 'r3', reminder_number: 3, due_date: '2026-07-30', reminder_status: 'completed', contact_id: 'c3', contact_date: '2026-08-01', contact_status: 'positive', contact_observation: 'Ok', registered_by_name: 'João', contact_created_at: '2026-08-01T00:00:00.000Z' },
        ],
      });

      const result = await service.getAdoptionTimeline('request-id', 'ong-id');
      expect(result.is_complete).toBe(true);
    });

    it('should detect no_response pattern', async () => {
      mockRepository.getTimelineByAdoption.mockResolvedValue({
        adoptionInfo: {
          adoption_request_id: 'request-id',
          animal_name: 'Rex',
          adopter_name: 'Maria',
          adopter_phone: null,
          adopter_email: 'maria@test.com',
          adoption_date: '2026-05-01',
        },
        entries: [
          { reminder_id: 'r1', reminder_number: 1, due_date: '2026-05-31', reminder_status: 'completed', contact_id: 'c1', contact_date: '2026-06-01', contact_status: 'no_response', contact_observation: 'Sem retorno', registered_by_name: 'João', contact_created_at: '2026-06-01T00:00:00.000Z' },
          { reminder_id: 'r2', reminder_number: 2, due_date: '2026-06-30', reminder_status: 'completed', contact_id: 'c2', contact_date: '2026-07-01', contact_status: 'no_response', contact_observation: 'Sem retorno', registered_by_name: 'João', contact_created_at: '2026-07-01T00:00:00.000Z' },
          { reminder_id: 'r3', reminder_number: 3, due_date: '2026-07-30', reminder_status: 'pending', contact_id: null, contact_date: null, contact_status: null, contact_observation: null, registered_by_name: null, contact_created_at: null },
        ],
      });

      const result = await service.getAdoptionTimeline('request-id', 'ong-id');
      expect(result.has_no_response_pattern).toBe(true);
    });

    it('should not detect no_response pattern when not consecutive', async () => {
      mockRepository.getTimelineByAdoption.mockResolvedValue({
        adoptionInfo: {
          adoption_request_id: 'request-id',
          animal_name: 'Rex',
          adopter_name: 'Maria',
          adopter_phone: null,
          adopter_email: 'maria@test.com',
          adoption_date: '2026-05-01',
        },
        entries: [
          { reminder_id: 'r1', reminder_number: 1, due_date: '2026-05-31', reminder_status: 'completed', contact_id: 'c1', contact_date: '2026-06-01', contact_status: 'no_response', contact_observation: 'Sem retorno', registered_by_name: 'João', contact_created_at: '2026-06-01T00:00:00.000Z' },
          { reminder_id: 'r2', reminder_number: 2, due_date: '2026-06-30', reminder_status: 'completed', contact_id: 'c2', contact_date: '2026-07-01', contact_status: 'positive', contact_observation: 'Ok', registered_by_name: 'João', contact_created_at: '2026-07-01T00:00:00.000Z' },
          { reminder_id: 'r3', reminder_number: 3, due_date: '2026-07-30', reminder_status: 'pending', contact_id: null, contact_date: null, contact_status: null, contact_observation: null, registered_by_name: null, contact_created_at: null },
        ],
      });

      const result = await service.getAdoptionTimeline('request-id', 'ong-id');
      expect(result.has_no_response_pattern).toBe(false);
    });
  });
});
