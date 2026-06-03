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
