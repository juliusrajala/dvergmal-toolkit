import { type APIRoute, type AstroCookies } from 'astro';
import { createDieRoll, getDierollsInGame } from '../../../../db/repository/dieroll';
import { getCurrentPlayerId } from '../../../../db/utils/session';
import { rollDice } from '../../../../tools/dice';

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
    const rolledDice = input.dice;
    if (!Array.isArray(rolledDice) || rolledDice.length === 0) {
      throw new Error('No dice provided for rolling');
    }

    console.log("Received dice to roll:", rolledDice);
    const { total, dice } = rollDice(rolledDice);

    console.log("Rolled dice result:", { total, dice });
    const { playerId, gameIdAsNumber } = await validateEndpoints(cookies, params.gameId);
    const dieRolls = await createDieRoll(
      playerId,
      gameIdAsNumber,
      input.notation,
      total,
      dice
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


