import { isValidCpf, sanitizeCpf } from '~/shared/utils/cpf.util';

describe('CPF Util', () => {
  describe('sanitizeCpf', () => {
    it('should remove dots and dash from formatted CPF', () => {
      expect(sanitizeCpf('529.982.247-25')).toBe('52998224725');
    });

    it('should return same string if already sanitized', () => {
      expect(sanitizeCpf('52998224725')).toBe('52998224725');
    });

    it('should remove any non-digit characters', () => {
      expect(sanitizeCpf('529 982 247 25')).toBe('52998224725');
    });
  });

  describe('isValidCpf', () => {
    it('should return true for a valid CPF (digits only)', () => {
      expect(isValidCpf('52998224725')).toBe(true);
    });

    it('should return true for a valid CPF with mask', () => {
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });

    it('should return true for another valid CPF', () => {
      expect(isValidCpf('11144477735')).toBe(true);
    });

    it('should return false for all same digits (11111111111)', () => {
      expect(isValidCpf('11111111111')).toBe(false);
    });

    it('should return false for all same digits (00000000000)', () => {
      expect(isValidCpf('00000000000')).toBe(false);
    });

    it('should return false for incorrect check digit', () => {
      expect(isValidCpf('52998224726')).toBe(false);
    });

    it('should return false for less than 11 digits', () => {
      expect(isValidCpf('123')).toBe(false);
    });

    it('should return false for more than 11 digits', () => {
      expect(isValidCpf('123456789012')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidCpf('')).toBe(false);
    });
  });
});
