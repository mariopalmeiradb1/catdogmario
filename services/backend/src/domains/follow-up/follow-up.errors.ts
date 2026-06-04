import { AppError } from '~/domains/auth/auth.errors';

export class ReminderNotFoundError extends AppError {
  constructor() {
    super(404, 'REMINDER_NOT_FOUND', 'Lembrete de acompanhamento não encontrado.');
  }
}

export class ReminderNotPendingError extends AppError {
  constructor(message: string) {
    super(422, 'REMINDER_NOT_PENDING', message);
  }
}

export class ContactAlreadyRegisteredError extends AppError {
  constructor() {
    super(409, 'CONTACT_ALREADY_REGISTERED', 'Este acompanhamento já foi registrado.');
  }
}

export class InvalidContactDateError extends AppError {
  constructor(message: string) {
    super(422, 'INVALID_CONTACT_DATE', message);
  }
}

export class ContactNotFoundError extends AppError {
  constructor() {
    super(404, 'CONTACT_NOT_FOUND', 'Registro de contato não encontrado.');
  }
}

export class InsufficientPermissionError extends AppError {
  constructor() {
    super(403, 'INSUFFICIENT_PERMISSION', 'Você não tem permissão para realizar esta ação.');
  }
}
