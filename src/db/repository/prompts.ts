import { and, countDistinct, db, desc, eq, Game, inArray, PlayerDieRoll, PlayerInGame, RollPrompt } from 'astro:db';

export const getPromptsByGameId = async (playerId: number, gameId: number) => {
  // Check if player is part of the game
  const playerInGame = await db
    .select()
    .from(PlayerInGame)
    .where(and(eq(PlayerInGame.playerId, playerId), eq(PlayerInGame.gameId, gameId)))
    .limit(1);

  if (playerInGame.length === 0) {
    throw new Error('Player is not part of the game');
  }

  const prompts = await db
    .select()
    .from(RollPrompt)
    .where(and(
      eq(RollPrompt.gameId, gameId),
    ))
    .orderBy(desc(RollPrompt.createdAt))
    .limit(20);

  return prompts;
}

export const getPromptsWithRelatedRolls = async (
  playerId: number, gameId: number
): Promise<PromptWithRelatedRolls[]> => {
  // Check if player is part of the game
  const playerInGame = await db
    .select()
    .from(PlayerInGame)
    .where(and(eq(PlayerInGame.playerId, playerId), eq(PlayerInGame.gameId, gameId)))
    .limit(1);

  if (playerInGame.length === 0) {
    throw new Error('Player is not part of the game');
  }

  const prompts = await db
    .select()
    .from(RollPrompt)
    .where(eq(RollPrompt.gameId, gameId))
    .orderBy(desc(RollPrompt.createdAt))
    .limit(5);

  const relatedDieRolls = await db
    .select()
    .from(PlayerDieRoll)
    .where(inArray(PlayerDieRoll.promptId, prompts.map(p => p.id)))
    .orderBy(desc(PlayerDieRoll.createdAt))

  const promptsWithRolls = prompts.map(prompt => ({
    ...prompt,
    playerIds: prompt.playerIds as number[],
    relatedDieRolls: relatedDieRolls.filter(roll => roll.promptId === prompt.id)
  })) as PromptWithRelatedRolls[];

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
    .values({
      gameId,
      prompt: reason,
      createdAt: new Date(),
      playerIds: targetPlayerIds
    })
    .returning();

  return newPrompts;
}

export interface Prompt {
  id: number;
  gameId: number;
  prompt: string;
  createdAt: Date;
  playerIds: number[]; // Array of player IDs who were prompted
}

export interface PromptWithRelatedRolls extends Prompt {
  relatedDieRolls: {
    id: number;
    playerId: number;
    gameId: number;
    rollTotal: number;
    context: string | null;
    promptId: number | null;
    createdAt: Date;
    dies: unknown;
  }[];
}