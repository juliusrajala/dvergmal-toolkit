import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getCurrentPlayerId } from '../db/utils/session';
import { getPlayerInGame } from '../db/repository/game';
import { createDieRoll, getDierollsInGame } from '../db/repository/dieroll';

export const dieRollActions = {
  createDieRoll: defineAction({
    input: z.object({
      gameId: z.number(),
      notation: z.string().min(1, 'Notation is required'),
    }),
    handler: async (input, { cookies, ...rest }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }

      const playerInGame = await getPlayerInGame(playerId, input.gameId);
      if (!playerInGame) {
        throw new Error('Player is not in the game');
      }

      const dieRoll = await createDieRoll(
        playerId,
        input.gameId,
        input.notation,
        Math.floor(Math.random() * 20) + 1, // Example roll result, replace with actual logic
        [{ die: 20, value: Math.floor(Math.random() * 20) + 1 }] // Example dies, replace with actual
      );

      return { dieRoll };
    }
  }),
  getDieRolls: defineAction({
    input: z.object({
      gameId: z.number(),
    }),
    handler: async (input, { cookies, ...rest }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }

      const dieRolls = await getDierollsInGame(playerId, input.gameId);
      return { dieRolls };
    }
  })

}
