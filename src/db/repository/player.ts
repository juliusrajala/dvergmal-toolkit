import { db, eq, Password, Player } from 'astro:db';

import { hashPassword } from '../utils/hash';
import { createSession, validateInvitationCode } from '../utils/session';

export async function signupPlayer(email: string, password: string, invitation: string): Promise<string> {
  const validInvitation = validateInvitationCode(invitation);
  if (!validInvitation) {
    throw new Error('Invalid invitation code');
  }

  const playerId = await db.transaction(async (tx) => {
    const hashedPassword = await hashPassword(password);
    // Insert new player
    const [newPlayer] = await tx
      .insert(Player)
      .values({ email })
      .returning({ id: Player.id });

    if (!newPlayer) {
      throw new Error('Failed to create new player');
    }

    // Insert password hash
    await tx.insert(Password).values({
      hash: hashedPassword,
      playerId: newPlayer.id,
    });

    return newPlayer.id;
  });

  const sessionToken = await createSession(playerId);
  return sessionToken;

}