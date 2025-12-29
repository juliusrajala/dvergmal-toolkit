import { type APIRoute } from 'astro';

import { getOwnedNotes } from '../../../../db/repository/note';
import { validateEndpoints } from '../../../../db/utils/validation';

export const GET: APIRoute = async ({ cookies, params }) => {
  try {
    const { playerId, gameIdAsNumber } = await validateEndpoints(cookies, params.gameId);
    const notes = await getOwnedNotes(playerId, gameIdAsNumber);
    return new Response(
      JSON.stringify({ notes }),
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400 }
    );
  }
}