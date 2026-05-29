import { hashPassword, comparePassword } from '~/shared/utils/hash.util';

describe('hash.util', () => {
  it('should hash a password and return a string', async () => {
    const hash = await hashPassword('Test@123');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('Test@123');
  });

  it('should produce different hashes for same input (salt)', async () => {
    const hash1 = await hashPassword('Test@123');
    const hash2 = await hashPassword('Test@123');
    expect(hash1).not.toBe(hash2);
  });

  it('should compare correctly with valid password', async () => {
    const hash = await hashPassword('Test@123');
    const isValid = await comparePassword('Test@123', hash);
    expect(isValid).toBe(true);
  });

  it('should compare correctly with invalid password', async () => {
    const hash = await hashPassword('Test@123');
    const isValid = await comparePassword('Wrong@123', hash);
    expect(isValid).toBe(false);
  });
});
