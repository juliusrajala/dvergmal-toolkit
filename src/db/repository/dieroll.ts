import { and, db, desc, eq, PlayerDieRoll, PlayerInGame, RollPrompt } from 'astro:db';
import { z } from 'astro:schema';

const dieInRoll = z.object({
  die: z.string(),
  value: z.number().min(1),
})

export type Die = z.infer<typeof dieInRoll>;

export async function createDieRoll({
  playerId, gameId, notation, result, dies, promptId
}: {
  playerId: number,
  gameId: number,
  notation: string,
  result: number,
  dies: Die[],
  promptId?: number
}) {
  // Validate dies structure
  const parsedDies = z.array(dieInRoll).parse(dies);
  if (parsedDies.length === 0) {
    throw new Error('At least one die must be rolled');
  }

  // Insert the die roll into the database
  await db
    .insert(PlayerDieRoll)
    .values({
      playerId,
      createdAt: new Date(),
      gameId,
      promptId,
      context: notation,
      rollTotal: result,
      dies: parsedDies,
    })

  return await getDierollsInGame(playerId, gameId);
}

export interface DieRoll {
  id: number;
  player: {
    id: number;
    characterName: string;
  }
  gameId: number;
  rollTotal: number;
  context?: string;
  createdAt: Date;
  dies: Die[];
  relatedPrompt: {
    id: number;
    gameId: number;
    prompt: string;
    createdAt: Date;
  } | null;
}


export async function getDierollsInGame(playerId: number, gameId: number): Promise<DieRoll[]> {
  const playerInGame = await db
    .select()
    .from(PlayerInGame)
    .where(and(eq(PlayerInGame.playerId, playerId), eq(PlayerInGame.gameId, gameId)))
    .limit(1);

  if (playerInGame.length === 0) {
    throw new Error('Player is not part of the game');
  }

  const dieRolls = await db
    .select()
    .from(PlayerDieRoll)
    .innerJoin(PlayerInGame,
      and(
        eq(PlayerDieRoll.playerId, PlayerInGame.playerId),
        eq(PlayerDieRoll.gameId, PlayerInGame.gameId)
      )
    )
    .leftJoin(RollPrompt, eq(PlayerDieRoll.promptId, RollPrompt.id))
    .where(eq(PlayerDieRoll.gameId, gameId))
    .orderBy(desc(PlayerDieRoll.createdAt))
    .limit(20);


  return dieRolls.map(({ PlayerDieRoll, PlayerInGame, RollPrompt }) => ({
    ...PlayerDieRoll,
    relatedPrompt: RollPrompt,
    player: {
      id: PlayerInGame.playerId,
      characterName: PlayerInGame.characterName,
    },
  })) as DieRoll[];
}