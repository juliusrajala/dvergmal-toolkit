import { and, asc, db, desc, eq, Player,PlayerDieRoll, PlayerInGame } from 'astro:db';
import { z } from 'astro:schema';

const dieInRoll = z.object({
  die: z.string(),
  value: z.number().min(1),
})

export type Die = z.infer<typeof dieInRoll>;

export async function createDieRoll(
  playerId: number,
  gameId: number,
  notation: string,
  result: number,
  dies: Die[]
) {
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
    .where(and(eq(PlayerDieRoll.playerId, playerId), eq(PlayerDieRoll.gameId, gameId)))
    .orderBy(desc(PlayerDieRoll.createdAt))
    .limit(20);


  return dieRolls.map(({ PlayerDieRoll, PlayerInGame }) => ({
    ...PlayerDieRoll,
    player: {
      id: PlayerInGame.playerId,
      characterName: PlayerInGame.characterName,
    },
  })) as DieRoll[];
}