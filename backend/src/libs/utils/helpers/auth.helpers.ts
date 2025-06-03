import * as argon2 from 'argon2';

export class AuthHelpers {
  /**
   * Hash a plain text password using Argon2
   */
  async hashPassword(plainPassword: string): Promise<string> {
    try {
      const hashedPassword = await argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  /**
   * Verify a plain text password against a hashed password
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      throw new Error('Error verifying password');
    }
  }
}
