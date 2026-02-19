import { type APIRoute } from 'astro';

import { checkNoteOwnership, shareNoteInGame } from '../../../../db/repository/note';
import { toNumber, validatePlayer } from '../../../../db/utils/validation';

// TODO: The back end supports sharing notes to individual players instead of the whole game. Implement this.
export const POST: APIRoute = async ({ cookies, params, request }) => {
  const input = await request.json();
  try {
    const gameId = toNumber(input.gameId, 'Invalid Game ID');
    if (!gameId) {
      throw new Error('Game ID must be provided');
    }
    const playerId = await validatePlayer(cookies);
    const id = toNumber(params.id);
    if (!(await checkNoteOwnership(id, playerId))) {
      throw new Error('Unauthorized');
    }
    const success = await shareNoteInGame(id, gameId); 
    return new Response(JSON.stringify( { success: success } ), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400 }
    );
  }
}