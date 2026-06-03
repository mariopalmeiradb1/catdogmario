import { AppError } from '~/domains/auth/auth.errors';

export class AdopterProfileAlreadyExistsError extends AppError {
  constructor() {
    super(409, 'ADOPTER_PROFILE_ALREADY_EXISTS', 'Este usuário já possui um perfil de adotante.');
  }
}

export class CpfAlreadyRegisteredError extends AppError {
  constructor() {
    super(409, 'CPF_ALREADY_REGISTERED', 'CPF já cadastrado no sistema. Entre em contato com o suporte.');
  }
}

export class InvalidCpfError extends AppError {
  constructor() {
    super(422, 'INVALID_CPF', 'CPF inválido. Verifique o número informado.');
  }
}

export class UnderageAdopterError extends AppError {
  constructor() {
    super(422, 'UNDERAGE_ADOPTER', 'É necessário ter 18 anos ou mais para adotar.');
  }
}

export class AdopterProfileNotFoundError extends AppError {
  constructor() {
    super(404, 'ADOPTER_PROFILE_NOT_FOUND', 'Perfil de adotante não encontrado.');
  }
}

export class UnauthorizedProfileAccessError extends AppError {
  constructor() {
    super(403, 'UNAUTHORIZED_PROFILE_ACCESS', 'Acesso não autorizado a este perfil.');
  }
}
