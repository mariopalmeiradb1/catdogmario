import { AppError } from '~/domains/auth/auth.errors';

export class OngNotFoundError extends AppError {
  constructor() {
    super(404, 'ONG_NOT_FOUND', 'ONG não encontrada.');
  }
}

export class InvalidOngStatusTransitionError extends AppError {
  constructor() {
    super(403, 'INVALID_ONG_STATUS', 'A ONG precisa estar aprovada para editar dados.');
  }
}

export class CnpjDuplicateError extends AppError {
  constructor() {
    super(409, 'CNPJ_DUPLICATE', 'CNPJ já cadastrado em outra organização.');
  }
}
