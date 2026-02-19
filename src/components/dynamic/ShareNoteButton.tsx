interface Props {
  id: number;
  gameId: number;
}

const shareNote = async (id: number, gameId: number): Promise<{ success: boolean }> => {
  const res = await fetch('/api/notes/share/' + id, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId }),
  });
  if (!res.ok) {
    throw new Error('Failed to share note ' + id);
  }

  return res.json();
}

const ShareNoteButton = ({ id, gameId }: Props) => {

  const shareNoteById = async () => {
    try {
      const { success } = await shareNote(id, gameId);
      if (!success) { throw new Error(); }
      console.log('SHARED GAME', success);
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  }

  return (
    <div className="tooltip" data-tip="Share note to game">
      <button type="button" onClick={() => shareNoteById()} className="btn btn-circle btn-primary w-8 h-8 mr-4"><img className="w-6 h-6" src="/icons/triangle_right.svg"/></button>
    </div>
  );
}


export default ShareNoteButton;