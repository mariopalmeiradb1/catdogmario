import { AppError } from '~/domains/auth/auth.errors';

export class AnimalNotAvailableError extends AppError {
  constructor() {
    super(422, 'ANIMAL_NOT_AVAILABLE', 'Este animal não está disponível para adoção.');
  }
}

export class DuplicateAdoptionRequestError extends AppError {
  constructor() {
    super(409, 'DUPLICATE_ADOPTION_REQUEST', 'Você já possui um pedido ativo para este animal.');
  }
}

export class AdoptionRequestNotFoundError extends AppError {
  constructor() {
    super(404, 'ADOPTION_REQUEST_NOT_FOUND', 'Pedido de adoção não encontrado.');
  }
}

export class CannotCancelRequestError extends AppError {
  constructor() {
    super(422, 'CANNOT_CANCEL_REQUEST', 'Apenas pedidos com status Pendente ou Em Análise podem ser cancelados.');
  }
}

export class NotRequestOwnerError extends AppError {
  constructor() {
    super(403, 'NOT_REQUEST_OWNER', 'Você não tem permissão para cancelar este pedido.');
  }
}

export class InvalidRequestTransitionError extends AppError {
  constructor(action: string) {
    super(422, 'INVALID_REQUEST_TRANSITION', `Este pedido não pode ser ${action} no status atual.`);
  }
}

// Visit scheduling errors (TASK-BACKEND-009)
export class AnimalAlreadyInProcessError extends AppError {
  constructor() {
    super(409, 'ANIMAL_ALREADY_IN_PROCESS', 'Este animal já está em processo de adoção. Não é possível agendar outra visita.');
  }
}

export class AnimalAlreadyAdoptedError extends AppError {
  constructor() {
    super(409, 'ANIMAL_ALREADY_ADOPTED', 'Este animal já foi adotado.');
  }
}

export class RequestNotEligibleForVisitError extends AppError {
  constructor() {
    super(422, 'REQUEST_NOT_ELIGIBLE', 'Este pedido de adoção não está elegível para agendamento de visita.');
  }
}

export class InvalidVisitDateError extends AppError {
  constructor(message: string) {
    super(422, 'INVALID_VISIT_DATE', message);
  }
}

// Visit completion errors (TASK-BACKEND-010)
export class VisitNotFoundError extends AppError {
  constructor() {
    super(404, 'VISIT_NOT_FOUND', 'Visita não encontrada.');
  }
}

export class VisitAlreadyCompletedError extends AppError {
  constructor() {
    super(409, 'VISIT_ALREADY_COMPLETED', 'Esta visita já foi registrada como realizada.');
  }
}

export class VisitCancelledError extends AppError {
  constructor() {
    super(422, 'VISIT_CANCELLED', 'Não é possível registrar uma visita que foi cancelada.');
  }
}

export class InvalidCompletionDateError extends AppError {
  constructor(message: string) {
    super(422, 'INVALID_COMPLETION_DATE', message);
  }
}

export class VisitOngMismatchError extends AppError {
  constructor() {
    super(403, 'VISIT_ONG_MISMATCH', 'Você não tem permissão para registrar visitas de outra organização.');
  }
}
