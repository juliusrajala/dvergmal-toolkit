import { defineAction } from 'astro:actions';
import { getCurrentPlayerId } from '../db/utils/session';
import { createGame, joinGameByNameAndSecret } from '../db/repository/game';
import { z } from 'astro:schema';

export const gameActions = {
  createGame: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(5, 'Game name is required'),
      secret: z.string().min(10, 'Game secret is required'),
    }),
    handler: async (input, { cookies, ...rest }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }

      const game = await createGame(playerId, input.name, input.secret);
      return { gameId: game };
    }
  }),
  joinGameByNameAndSecret: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(10, 'Game name is required'),
      secret: z.string().min(16, 'Game secret is required'),
    }),
    handler: async (input, { cookies, ...rest }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }

      await joinGameByNameAndSecret(playerId, input.name, input.secret);
      return { success: true };
    }
  })
}