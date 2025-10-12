import { db, Game, eq, and, PlayerInGame, Player } from 'astro:db';

export async function createGame(ownerId: number, name: string, secret: string): Promise<number> {
  const [newGame] = await db
    .insert(Game)
    .values({ ownerId, name, secret, createdAt: new Date() })
    .returning({ id: Game.id });

  if (!newGame) {
    throw new Error('Failed to create new game');
  }

  // Automatically add the owner as a player in the game
  await db
    .insert(PlayerInGame)
    .values({ playerId: ownerId, gameId: newGame.id, joinedAt: new Date(), characterName: 'Dungeon Master' });

  return newGame.id;
}

export async function getGameById(gameId: number) {
  const [game] = await db
    .select()
    .from(Game)
    .where(eq(Game.id, gameId))
    .limit(1);

  return game || null;
}

export async function getGamesByOwner(ownerId: number) {
  const games = await db
    .select()
    .from(Game)
    .where(eq(Game.ownerId, ownerId));

  return games;
}

export async function getGameByPlayerAndGameId(
  playerId: number,
  gameId: number
) {
  const [{ Game: game }] = await db
    .select()
    .from(Game)
    .innerJoin(
      PlayerInGame,
      eq(Game.id, PlayerInGame.gameId)
    )
    .where(and(eq(PlayerInGame.playerId, playerId), eq(Game.id, gameId)))
    .limit(1);

  return game || null;
}

export async function joinGameByNameAndSecret(
  playerId: number,
  name: string,
  secret: string,
  characterName: string = 'Adventurer'
): Promise<void> {
  const [game] = await db
    .select()
    .from(Game)
    .where(and(eq(Game.name, name), eq(Game.secret, secret)))
    .limit(1);

  if (!game) {
    throw new Error('Game not found or invalid secret');
  }

  await db
    .insert(PlayerInGame)
    .values({ playerId, gameId: game.id, joinedAt: new Date(), characterName });

}

export async function getPlayerGames(playerId: number) {
  const games = await db
    .select()
    .from(Game)
    .innerJoin(
      PlayerInGame,
      eq(Game.id, PlayerInGame.gameId)
    )
    .innerJoin(Player, eq(Player.id, Game.ownerId))
    .where(eq(PlayerInGame.playerId, playerId));

  return games.map(({ Game, Player, PlayerInGame }) => ({
    ...Game,
    ownerEmail: Player.email,
    characterName: PlayerInGame.characterName,
    joined: PlayerInGame.joinedAt
  }));
}

export async function getPlayerInGame(playerId: number, gameId: number) {
  const [playerInGame] = await db
    .select()
    .from(PlayerInGame)
    .where(and(eq(PlayerInGame.playerId, playerId), eq(PlayerInGame.gameId, gameId)))
    .limit(1);

  return playerInGame || null;
}