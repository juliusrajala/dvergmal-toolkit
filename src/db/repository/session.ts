import { db, eq, Password, Player } from 'astro:db';

import { hashPassword, verifyPassword } from '../utils/hash';
import { createSession, validateInvitationCode } from '../utils/session';

export async function signupAndCreateSession(email: string, password: string, invitation: string): Promise<string> {
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

export async function loginPlayer(email: string, password: string): Promise<string> {
  const [player] = await db
    .select()
    .from(Player)
    .where(eq(Player.email, email))
    .innerJoin(Password, eq(Password.playerId, Player.id))
    .limit(1);

  if (!player || !player.Password) {
    throw new Error('Invalid email or password');
  }

  const passwordMatches = await verifyPassword(password, player.Password.hash);
  if (!passwordMatches) {
    throw new Error('Invalid email or password');
  }

  const sessionToken = await createSession(player.Player.id);
  return sessionToken;
}
