import { getSecret } from 'astro:env/server';
import bcrypt from 'bcrypt';

// Salt rounds for bcrypt (12 rounds = ~300ms per hash, good security/performance balance)
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with a pepper (secret) from environment variables.
 * The pepper adds an additional layer of security by mixing a secret string with the password.
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const pepper = getSecret('DB_PEPPER');

  if (!pepper) {
    throw new Error('DB_PEPPER environment variable is required for secure password hashing');
  }

  // Combine password with pepper before hashing
  const pepperedPassword = password + pepper;

  return await bcrypt.hash(pepperedPassword, SALT_ROUNDS);
}

/**
 * Verify a password against a hashed password.
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns A promise that resolves to true if the password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const pepper = getSecret('DB_PEPPER');

  if (!pepper) {
    throw new Error('DB_PEPPER environment variable is required for password verification');
  }

  // Combine password with pepper before verifying
  const pepperedPassword = password + pepper;

  return await bcrypt.compare(pepperedPassword, hashedPassword);
}