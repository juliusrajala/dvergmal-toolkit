import { z } from 'astro:schema';
import { getCurrentPlayerId } from '../db/utils/session';
import { defineAction } from 'astro:actions';
import { createPrompt } from '../db/repository/prompts';

export const promptActions = {
  promptPlayers: defineAction({
    accept: 'form',
    input: z.object({
      reason: z.string().optional(),
      targetPlayerIds: z.array(z.number()).min(1, 'Select at least one player'),
    }),
    handler: async (input, { cookies, params }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }
      const gameId = params.gameId;
      if (!gameId) {
        throw new Error('Game ID is required');
      }
      if (!input.targetPlayerIds || input.targetPlayerIds.length === 0) {
        throw new Error('Select at least one player to prompt');
      }


      await createPrompt(playerId, Number(gameId), input.targetPlayerIds, input.reason || 'Roll prompted.');


      return { success: true }
    },
  })

}