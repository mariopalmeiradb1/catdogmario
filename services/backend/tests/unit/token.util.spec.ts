import { generateAccessToken, verifyAccessToken, generateResetToken, verifyResetToken } from '~/shared/utils/token.util';

describe('token.util', () => {
  describe('generateAccessToken / verifyAccessToken', () => {
    it('should generate a valid JWT and verify it', () => {
      const payload = { userId: 'user-123', role: 'adopter' as const, ongId: null };
      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe('user-123');
      expect(decoded.role).toBe('adopter');
      expect(decoded.ongId).toBeNull();
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should include ongId when present', () => {
      const payload = { userId: 'user-456', role: 'ong_admin' as const, ongId: 'ong-789' };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.ongId).toBe('ong-789');
    });
  });

  describe('generateResetToken / verifyResetToken', () => {
    it('should generate and verify a reset token', () => {
      const token = generateResetToken('user-123');
      const decoded = verifyResetToken(token);
      expect(decoded.userId).toBe('user-123');
    });

    it('should throw on invalid reset token', () => {
      expect(() => verifyResetToken('invalid-token')).toThrow();
    });
  });
});
