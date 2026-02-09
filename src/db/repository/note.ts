import { and, db, eq, isNull, Note, or, ShareNoteEvent } from 'astro:db';

export type Note = { id: number, playerId: number, createdAt: Date, note: string, title?: string, imgSrc?: string, gameId?: number, sharedAt?: Date };
export type NoteUpdate = { note?: string, title?: string, imgSrc?: string, gameId?: number };

/**
 * Create a new note
 * @param playerId Player that owns the note
 * @param note Content of the note
 * @param title Optional title for the note
 * @param imgSrc Optional source for the image of the note
 * @param gameId Game that the note is in relation to. If not given, the note can be applied to many games.
 * @returns The created note
 */
export async function createNote(playerId: number, note: string, title?: string, imgSrc?: string, gameId?: number): Promise<Note> {
  const createdNote = (await db
    .insert(Note)
    .values({ playerId: playerId, createdAt: new Date(), note: note, title: title, imgSrc: imgSrc, gameId: gameId })
    .returning())[0] as Note;
  if (!createdNote) {
    throw new Error('Failed to create new game');
  }
  return createdNote;
}

export async function updateNote(id: number, updateValues: NoteUpdate): Promise<Note> {
  // If nothing should be updated, just return the Note from DB
  if (Object.keys(updateValues).length === 0) {
    return (await db
    .select()
    .from(Note)
    .where(eq(Note.id, id)))[0] as Note;
  }
  // Update Note
  const updatedNote = (await db
    .update(Note)
    .set(updateValues)
    .where(eq(Note.id, id))
    .returning())[0] as Note;

  if (!updatedNote) {
    throw new Error('Failed to create new game');
  }
  return updatedNote;
}

/**
 * Get notes owned by the player
 * @param playerId Player in question
 * @param gameId Game that is the specific target in mind
 * @returns List of notes filtered by the parameters
 */
export async function getOwnedNotes(playerId: number, gameId?: number): Promise<Note[]> {
  const condition = () =>
    gameId
    ? and(eq(Note.playerId, playerId), or(eq(Note.gameId, gameId), isNull(Note.gameId)))
    : eq(Note.playerId, playerId);
  const notes = await db
    .select()
    .from(Note)
    .where(condition()) as Note[];
  return notes || [];
}

/**
 * Get notes shared in a game that the user has access to
 * @param gameId ID of the game in question
 * @param gameId ID of the user in question
 * @returns List of notes with share times, may contain duplicates if shared multiple times
 */
export async function shareNoteInGame(noteId: number, gameId: number, playerIds?: number[]): Promise<number[]> {
  // Create the base event to be inserted to ShareNoteEvent and a list to bontain all potentially inserted events
  const eventBase = {
    noteId: noteId,
    gameId: gameId,
    sharedAt: new Date()
  };
  const events: { noteId: number, gameId: number, sharedAt: Date, playerId?: number}[] = [];

  // Fill teh event list with a ShareNoteEvent for every player that needs to be targeted separately (including the owner) or for the whole game
  if (playerIds && playerIds.length) {
    if (playerIds.length < 2) { throw new Error('Player listing must be undefined, empty, or contain at least the game owner and their target player. Only one player ID provided.'); }
    for (const player of playerIds) {
      events.push({ ...eventBase, playerId: player });
    }
  } else {
    events.push(eventBase);
  }

  // Map the events into insert queries and run them as a batch
  const queries = events.map(event => db.insert(ShareNoteEvent).values(event).returning({ id: ShareNoteEvent.id }));
  // NOTE: Formatting below is because the argument for .batch() is expected to be ensured at the type level to not be empty. See https://github.com/withastro/astro/issues/11865.
  const [firstQuery, ...restOfQueries] = queries;
  const sharedEventIdList = (await db.batch([firstQuery, ...restOfQueries])).map(val => (val[0]).id);
  if (!sharedEventIdList?.length) { throw new Error('Failed to share any notes for game ' + gameId); }
  return sharedEventIdList;
}


/**
 * Get notes that should show in the player's game feed
 * @param gameId ID of the game in question
 * @param playerId ID of the player in question
 * @returns List of notes with share times, may contain duplicates if shared multiple times
 */
export async function getSharedNotesForUserFeed(gameId: number, playerId: number): Promise<Note[]> {
  const notes = (await db
    .select()
    .from(ShareNoteEvent)
    .where(and(eq(ShareNoteEvent.gameId, gameId), or(eq(ShareNoteEvent.playerId, playerId), isNull(ShareNoteEvent.playerId))))
    .innerJoin(Note, eq(ShareNoteEvent.noteId, Note.id))
    .all()
    ).map(val => ({ ...val.Note, sharedAt: val.ShareNoteEvent.sharedAt })) as Note[];
  return notes || [];
}

/**
 * Delete Note and all of its ShareNoteEvents
 * @param id Note to be deleted
 * @returns true once the delete succeeds
 */
export async function deleteNote(id: number): Promise<boolean> {
  const result = await db.batch([ // NOTE: Use batch for delete as it should roll changes back on any failure
    db.delete(Note).where(eq(Note.id, id)),
    db.delete(ShareNoteEvent).where(eq(ShareNoteEvent.noteId, id))
  ]);
  if (!result) { throw new Error('Couldn\'t delete note from DB'); }
  return true;
}

/**
 * Check that the player owns the note in question
 * @param id Note to be checked
 * @param playerId Player to be checked
 * @returns true if the player owns the note in question
 */
export async function checkNoteOwnership(id: number, playerId: number): Promise<boolean> {
  const [result] = await db
    .select()
    .from(Note)
    .where(and(eq(Note.id, id), eq(Note.playerId, playerId))) as Note[];
  return !!result;
}