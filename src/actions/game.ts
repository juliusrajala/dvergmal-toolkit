import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

import { createGame, joinGameByNameAndSecret } from '../db/repository/game';
import { getCurrentPlayerId } from '../db/utils/session';

export const gameActions = {
  createGame: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(5, 'Game name is required'),
      secret: z.string().min(10, 'Game secret is required'),
    }),
    handler: async (input, { cookies }) => {
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
      chararacterName: z.string().min(1, 'Character name is required').max(30, 'Character name is too long'),
    }),
    handler: async (input, { cookies }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }

      await joinGameByNameAndSecret(playerId, input.name, input.secret);
      return { success: true };
    }
  })
}
