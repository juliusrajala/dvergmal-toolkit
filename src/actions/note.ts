import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

import { createNote, updateNote } from '../db/repository/note';
import { getCurrentPlayerId } from '../db/utils/session';

export const noteActions = {
  createNote: defineAction({
    accept: 'form',
    input: z.object({
      note: z.string().min(1),
      title: z.string().optional(),
      imgSrc: z.string().optional(),
      gameId: z.number().optional()
    }),
    handler: async (input, { cookies }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }

      const note = await createNote(playerId, input.note, input.title, input.imgSrc, input.gameId);
      return note;
    }
  }),
  updateNote: defineAction({
    accept: 'form',
    input: z.object({
      id: z.number(),
      note: z.string().min(1),
      title: z.string().optional(),
      imgSrc: z.string().optional(),
      gameId: z.number().optional()
    }),
    handler: async (input, { cookies }) => {
      const playerId = await getCurrentPlayerId(cookies);
      if (!playerId) {
        throw new Error('Not authenticated');
      }

      const note = await updateNote(input.id, { note: input.note, title: input.title, imgSrc: input.imgSrc, gameId: input.gameId });
      return note;
    }
  })
}
