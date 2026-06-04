import { AppError } from '~/domains/auth/auth.errors';

export class VolunteerNotFoundError extends AppError {
  constructor() {
    super(404, 'VOLUNTEER_NOT_FOUND', 'Voluntário não encontrado.');
  }
}

export class VolunteerEmailAlreadyExistsError extends AppError {
  constructor() {
    super(409, 'EMAIL_ALREADY_EXISTS', 'Este e-mail já está cadastrado no sistema.');
  }
}

export class VolunteerCpfAlreadyExistsError extends AppError {
  constructor() {
    super(409, 'CPF_ALREADY_EXISTS', 'Este CPF já está cadastrado no sistema.');
  }
}

export class InvalidVolunteerCpfError extends AppError {
  constructor() {
    super(422, 'INVALID_CPF', 'CPF inválido. Verifique o número informado.');
  }
}

export class UnderageVolunteerError extends AppError {
  constructor() {
    super(422, 'UNDERAGE_VOLUNTEER', 'É necessário ter 18 anos ou mais para ser voluntário.');
  }
}

export class VolunteerAlreadyInactiveError extends AppError {
  constructor() {
    super(422, 'VOLUNTEER_ALREADY_INACTIVE', 'Este voluntário já está inativo.');
  }
}

export class VolunteerAlreadyActiveError extends AppError {
  constructor() {
    super(422, 'VOLUNTEER_ALREADY_ACTIVE', 'Este voluntário já está ativo.');
  }
}
