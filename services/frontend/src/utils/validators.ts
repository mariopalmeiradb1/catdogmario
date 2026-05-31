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
