import type { Rule } from 'antd/es/form';
import { VALIDATION_MESSAGES } from './messages';

export const nameRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  { min: 3, message: VALIDATION_MESSAGES.NAME_MIN },
  { max: 100, message: VALIDATION_MESSAGES.NAME_MAX },
];

export const emailRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  { type: 'email', message: VALIDATION_MESSAGES.EMAIL_INVALID },
];

export const passwordRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  {
    pattern: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
    message: VALIDATION_MESSAGES.PASSWORD_WEAK,
  },
];

export const cnpjRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  {
    pattern: /^(\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/,
    message: VALIDATION_MESSAGES.CNPJ_INVALID,
  },
];

export const phoneRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  {
    pattern: /^(\d{10,11}|\(\d{2}\)\s?\d{4,5}-\d{4})$/,
    message: VALIDATION_MESSAGES.PHONE_INVALID,
  },
];

export const descriptionRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.DESCRIPTION_REQUIRED },
  { min: 50, message: VALIDATION_MESSAGES.DESCRIPTION_MIN },
  { max: 500, message: VALIDATION_MESSAGES.DESCRIPTION_MAX },
  {
    validator(_, value) {
      if (value && value.trim().length < 50) {
        return Promise.reject(new Error(VALIDATION_MESSAGES.DESCRIPTION_MIN));
      }
      return Promise.resolve();
    },
  },
];

export const capacityRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.CAPACITY_INVALID },
  {
    validator(_, value) {
      if (value === undefined || value === null) {
        return Promise.reject(new Error(VALIDATION_MESSAGES.CAPACITY_INVALID));
      }
      if (!Number.isInteger(value) || value < 1) {
        return Promise.reject(new Error(VALIDATION_MESSAGES.CAPACITY_INVALID));
      }
      return Promise.resolve();
    },
  },
];

export function stripMask(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
}

export const cpfRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  {
    validator(_, value) {
      if (!value) return Promise.resolve();
      const digits = value.replace(/\D/g, '');
      if (digits.length !== 11) {
        return Promise.reject(new Error(VALIDATION_MESSAGES.CPF_INVALID));
      }
      if (!isValidCpf(digits)) {
        return Promise.reject(new Error(VALIDATION_MESSAGES.CPF_INVALID));
      }
      return Promise.resolve();
    },
  },
];

export const rgRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  { max: 20, message: VALIDATION_MESSAGES.RG_MAX },
];

export const birthDateRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  {
    validator(_, value) {
      if (!value) return Promise.resolve();
      const dateStr = typeof value === 'string' ? value : value.format?.('YYYY-MM-DD');
      if (!dateStr) return Promise.reject(new Error(VALIDATION_MESSAGES.REQUIRED));
      const birth = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      const hasHadBirthday =
        monthDiff > 0 || (monthDiff === 0 && today.getDate() >= birth.getDate());
      const fullAge = hasHadBirthday ? age : age - 1;
      if (fullAge < 18) {
        return Promise.reject(new Error(VALIDATION_MESSAGES.BIRTH_DATE_UNDERAGE));
      }
      return Promise.resolve();
    },
  },
];

export const zipCodeRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  {
    pattern: /^\d{8}$/,
    message: VALIDATION_MESSAGES.ZIP_CODE_INVALID,
  },
];

export const stateRules: Rule[] = [
  { required: true, message: VALIDATION_MESSAGES.REQUIRED },
  {
    pattern: /^[A-Z]{2}$/,
    message: VALIDATION_MESSAGES.REQUIRED,
  },
];
