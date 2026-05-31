export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor() {
    super(409, 'EMAIL_ALREADY_EXISTS', 'Este e-mail já está cadastrado.');
  }
}

export class CnpjAlreadyExistsError extends AppError {
  constructor() {
    super(409, 'CNPJ_ALREADY_EXISTS', 'Este CNPJ já está cadastrado.');
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
  }
}

export class EmailNotConfirmedError extends AppError {
  constructor() {
    super(403, 'EMAIL_NOT_CONFIRMED', 'Confirme seu e-mail para acessar a plataforma.');
  }
}

export class OngPendingApprovalError extends AppError {
  constructor() {
    super(403, 'ONG_PENDING_APPROVAL', 'Sua ONG ainda está em análise. Você será notificado quando for aprovada.');
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super(400, 'TOKEN_EXPIRED', 'Este link expirou. Clique abaixo para receber um novo.');
  }
}

export class TokenAlreadyUsedError extends AppError {
  constructor() {
    super(400, 'TOKEN_ALREADY_USED', 'Este link já foi utilizado.');
  }
}

export class InvalidCodeError extends AppError {
  constructor() {
    super(400, 'INVALID_CODE', 'Código inválido.');
  }
}

export class CodeExpiredError extends AppError {
  constructor() {
    super(400, 'CODE_EXPIRED', 'Código expirado. Solicite um novo.');
  }
}

export class AccountDeactivatedError extends AppError {
  constructor() {
    super(401, 'ACCOUNT_DEACTIVATED', 'Sua sessão expirou. Faça login novamente.');
  }
}
