import type { AstroCookies } from 'astro';
import { db, eq, Session } from 'astro:db';
import { getSecret } from 'astro:env/server';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const IS_PRODUCTION = getSecret('NODE_ENV') === 'production';

/**
 * Generate a cryptographically secure random session token
 */
function generateSessionToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new session for a player
 * @param playerId - The ID of the player to create a session for
 * @returns The session token
 */
export async function createSession(playerId: number): Promise<string> {
  const sessionToken = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(Session).values({
    id: sessionToken,
    playerId,
    expiresAt,
    createdAt: now,
  });

  return sessionToken;
}

/**
 * Validate a session token and return the player ID if valid
 * @param sessionToken - The session token to validate
 * @returns The player ID if valid, null otherwise
 */
export async function validateSession(sessionToken: string): Promise<number | null> {
  const [session] = await db
    .select()
    .from(Session)
    .where(eq(Session.id, sessionToken))
    .limit(1);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (new Date() > new Date(session.expiresAt)) {
    // Clean up expired session
    await db.delete(Session).where(eq(Session.id, sessionToken));
    return null;
  }

  return session.playerId;
}

/**
 * Delete a session (logout)
 * @param sessionToken - The session token to delete
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(Session).where(eq(Session.id, sessionToken));
}

/**
 * Delete all sessions for a player (logout everywhere)
 * @param playerId - The player ID whose sessions to delete
 */
export async function deleteAllPlayerSessions(playerId: number): Promise<void> {
  await db.delete(Session).where(eq(Session.playerId, playerId));
}

/**
 * Set session cookie with secure options
 * @param cookies - Astro cookies object
 * @param sessionToken - The session token to set
 */
export function setSessionCookie(cookies: AstroCookies, sessionToken: string): void {
  cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true, // Prevents JavaScript access
    secure: IS_PRODUCTION, // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: SESSION_DURATION_MS / 1000, // Convert to seconds
    path: '/',
  });
}

/**
 * Get session token from cookies
 * @param cookies - Astro cookies object
 * @returns The session token if present, null otherwise
 */
export function getSessionToken(cookies: AstroCookies): string | null {
  return cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Clear session cookie (logout)
 * @param cookies - Astro cookies object
 */
export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Get the current logged-in player ID from cookies
 * @param cookies - Astro cookies object
 * @returns The player ID if logged in, null otherwise
 */
export async function getCurrentPlayerId(cookies: AstroCookies): Promise<number | null> {
  const sessionToken = getSessionToken(cookies);
  if (!sessionToken) {
    return null;
  }

  return await validateSession(sessionToken);
}

/**
 * Clean up all expired sessions (run this periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  await db.delete(Session).where(eq(Session.expiresAt, now));
}

/**
 * Validate the invitation code against the environment variable
 * @param invitation - The invitation code to validate
 * @returns True if valid, false otherwise
 */

export async function validateInvitationCode(invitation: string): Promise<boolean> {
  const validCode = getSecret('INVITATION_CODE')
  return invitation === validCode;
}
