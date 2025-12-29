import { type APIRoute } from 'astro';

import { createDieRoll, getDierollsInGame } from '../../../../db/repository/dieroll';
import { validateEndpoints } from '../../../../db/utils/validation';
import { rollDice } from '../../../../tools/dice';

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
    const promptId = input.promptId;
    if (!Array.isArray(rolledDice) || rolledDice.length === 0) {
      throw new Error('No dice provided for rolling');
    }

    console.log("Received dice to roll:", rolledDice);
    const { total, dice } = rollDice(rolledDice);

    console.log("Rolled dice result:", { total, dice });
    const { playerId, gameIdAsNumber } = await validateEndpoints(cookies, params.gameId);
    const dieRolls = await createDieRoll({
      playerId,
      gameId: gameIdAsNumber,
      notation: input.notation,
      result: total,
      promptId,
      dies: dice
    });

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


