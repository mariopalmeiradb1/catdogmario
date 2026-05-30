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

export function stripMask(value: string): string {
  return value.replace(/\D/g, '');
}
