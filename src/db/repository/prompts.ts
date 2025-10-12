import { and, countDistinct, db, desc, eq, Game, inArray, PlayerDieRoll, RollPrompt } from 'astro:db';

export const getPromptsByPlayerAndGameId = async (playerId: number, gameId: number) => {
  const prompts = await db
    .select()
    .from(RollPrompt)
    .where(and(eq(RollPrompt.playerId, playerId), eq(RollPrompt.gameId, gameId)))
    .orderBy(desc(RollPrompt.createdAt))
    .limit(5);
  return prompts;
}

export const getPromptsByGameId = async (gameId: number, ownerId: number) => {
  // Check if player owns the game
  const [{ count }] = await db
    .select({ count: countDistinct(Game.id) })
    .from(Game)
    .where(and(eq(Game.id, gameId), eq(Game.ownerId, ownerId)))
  if (count === 0) {
    throw new Error('Only the game owner can view prompts');
  }

  const prompts = await db
    .select()
    .from(RollPrompt)
    .where(eq(RollPrompt.gameId, gameId))
    .orderBy(desc(RollPrompt.createdAt))
    .limit(20);

  const relatedDieRolls = await db
    .select()
    .from(PlayerDieRoll)
    .where(inArray(PlayerDieRoll.promptId, prompts.map(p => p.id)))
    .orderBy(desc(PlayerDieRoll.createdAt))
    .limit(50);

  const promptsWithRolls = prompts.map(prompt => ({
    ...prompt,
    relatedDieRolls: relatedDieRolls.filter(roll => roll.promptId === prompt.id)
  }))

  return promptsWithRolls;
}


export const createPrompt = async (
  {
    playerId, gameId, targetPlayerIds, reason
  }
    : { playerId: number, gameId: number, targetPlayerIds: number[], reason: string }) => {
  // Check if player owns the game
  const [{ count }] = await db
    .select({ count: countDistinct(Game.id) })
    .from(Game)
    .where(and(eq(Game.id, gameId), eq(Game.ownerId, playerId)))

  if (count === 0) {
    throw new Error('Only the game owner can prompt players for rolls');
  }

  const newPrompts = await db
    .insert(RollPrompt)
    .values({ gameId, playerId, prompt: reason, createdAt: new Date(), playerIds: targetPlayerIds }

    )
    .returning();

  return newPrompts;
}