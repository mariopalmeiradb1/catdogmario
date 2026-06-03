export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function isValidCpf(cpf: string): boolean {
  const sanitized = sanitizeCpf(cpf);

  if (sanitized.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(sanitized)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(sanitized.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(sanitized.charAt(9))) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(sanitized.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(sanitized.charAt(10))) {
    return false;
  }

  return true;
}
