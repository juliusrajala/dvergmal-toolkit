import { type AstroCookies } from 'astro';

import { getCurrentPlayerId } from "./session";

export const validateEndpoints = async (cookies: AstroCookies, gameId?: string) => {
  const gameIdAsNumber = Number(gameId);
  if (!gameId || isNaN(gameIdAsNumber)) {
    throw new Error('Invalid game ID');
  }
  const playerId = await getCurrentPlayerId(cookies);

  if (!playerId) {
    throw new Error('Not authenticated');
  }

  return { playerId, gameIdAsNumber };
}