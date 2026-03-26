import { type AstroCookies } from 'astro';

import { getCurrentPlayerId } from "./session";

export const validateEndpoints = async (cookies: AstroCookies, gameId?: string) => {
  const gameIdAsNumber = toNumber(gameId, 'Invalid game ID');
  const playerId = await validatePlayer(cookies);
  return { playerId, gameIdAsNumber };
}

export const validatePlayer = async (cookies: AstroCookies) => {
  const playerId = await getCurrentPlayerId(cookies);
  if (!playerId) {
    throw new Error('Not authenticated');
  }
  return playerId;
}

export const toNumber = (val?: string, errorString: string = 'Invalid value') => {
  const valAsNumber = Number(val);
  if (!val || isNaN(valAsNumber)) {
    throw new Error(errorString);
  }
  return valAsNumber;
}