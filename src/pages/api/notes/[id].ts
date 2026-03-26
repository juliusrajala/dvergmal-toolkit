import { type APIRoute } from 'astro';

import { checkNoteOwnership, deleteNote } from '../../../db/repository/note';
import { toNumber, validatePlayer } from '../../../db/utils/validation';

export const DELETE: APIRoute = async ({ cookies, params }) => {
  try {
    const playerId = await validatePlayer(cookies);
    const id = toNumber(params.id);
    if (!(await checkNoteOwnership(id, playerId))) {
      throw new Error('Unauthorized');
    }
    const success = await deleteNote(id);
    return new Response(JSON.stringify( { success: success } ), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400 }
    );
  }
}