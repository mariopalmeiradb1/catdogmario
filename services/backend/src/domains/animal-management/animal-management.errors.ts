import { AppError } from '~/domains/auth/auth.errors';

export class OngNotApprovedError extends AppError {
  constructor() {
    super(403, 'ONG_NOT_APPROVED', 'Sua ONG precisa estar aprovada para cadastrar animais.');
  }
}

export class AnimalNotFoundError extends AppError {
  constructor() {
    super(404, 'ANIMAL_NOT_FOUND', 'Animal não encontrado.');
  }
}

export class AnimalNotEditableError extends AppError {
  constructor() {
    super(422, 'ANIMAL_NOT_EDITABLE', 'Animais adotados ou inativos não podem ser editados.');
  }
}

export class CannotInactivateError extends AppError {
  constructor() {
    super(
      422,
      'CANNOT_INACTIVATE',
      'Não é possível inativar um animal que está em processo de adoção. Aguarde a conclusão ou cancelamento do processo.',
    );
  }
}

export class ConcurrencyConflictError extends AppError {
  constructor() {
    super(409, 'CONFLICT', 'Os dados foram alterados por outro usuário. Recarregue a página e tente novamente.');
  }
}

export class MediaLimitExceededError extends AppError {
  constructor(type: 'photo' | 'video') {
    const limit = type === 'photo' ? 3 : 1;
    const label = type === 'photo' ? 'fotos' : 'vídeo';
    super(422, 'MEDIA_LIMIT_EXCEEDED', `Limite de ${limit} ${label} atingido.`);
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      422,
      'INVALID_STATUS_TRANSITION',
      `Transição de status de "${fromStatus}" para "${toStatus}" não é permitida.`,
    );
  }
}
