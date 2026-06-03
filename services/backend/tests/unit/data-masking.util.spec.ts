import { maskCpf, maskRg } from '~/shared/utils/data-masking.util';

describe('Data Masking Util', () => {
  describe('maskCpf', () => {
    it('should mask CPF showing only middle digits', () => {
      expect(maskCpf('52998224725')).toBe('***.982.247-**');
    });

    it('should mask another CPF correctly', () => {
      expect(maskCpf('11144477735')).toBe('***.444.777-**');
    });
  });

  describe('maskRg', () => {
    it('should mask RG with 9 characters showing last 4', () => {
      expect(maskRg('123456789')).toBe('*****6789');
    });

    it('should mask RG with 7 characters showing last 4', () => {
      expect(maskRg('1234567')).toBe('***4567');
    });

    it('should mask RG with 10 characters showing last 4', () => {
      expect(maskRg('1234567890')).toBe('******7890');
    });
  });
});
