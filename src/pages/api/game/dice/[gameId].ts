import { type APIRoute, type AstroCookies } from 'astro';
import { createDieRoll, getDierollsInGame } from '../../../../db/repository/dieroll';
import { getCurrentPlayerId } from '../../../../db/utils/session';

const validateEndpoints = async (cookies: AstroCookies, gameId?: string) => {
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

export const GET: APIRoute = async ({ cookies, params }) => {
  try {
    const { playerId, gameIdAsNumber } = await validateEndpoints(cookies, params.gameId);
    const dieRolls = await getDierollsInGame(playerId, gameIdAsNumber)

    return new Response(
      JSON.stringify({ dieRolls }),
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400 }
    );
  }
}

export const POST: APIRoute = async ({ cookies, params, request }) => {
  const input = await request.json();
  try {
    const { playerId, gameIdAsNumber } = await validateEndpoints(cookies, params.gameId);
    const dieRolls = await createDieRoll(
      playerId,
      input.gameId,
      input.notation,
      Math.floor(Math.random() * 20) + 1, // Example roll result, replace with actual logic
      [{ die: 20, value: Math.floor(Math.random() * 20) + 1 }] // Example dies, replace with actual
    );

    return new Response(
      JSON.stringify({ dieRolls }),
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400 }
    );
  }

}


