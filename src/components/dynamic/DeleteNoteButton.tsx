interface Props {
  id: number;
}

const deleteNote = async (id: number): Promise<{ success: boolean }> => {
  const res = await fetch('/api/notes/' + id, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to delete note ' + id);
  }

  return res.json();
}

const DeleteNoteButton = ({ id }: Props) => {

  const deleteById = async () => {
    try {
      const { success } = await deleteNote(id);
      if (success) {
        // NOTE: A quick and dirty way to reload view to refresh the note listing
        // TODO: Check the correct/proper way to refresh server side listing. Current way causes any potential unsaved changes to be lost.
        window.location.href = window.location.origin + window.location.pathname;
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  return (
    <div className="tooltip" data-tip="Delete note">
      <button type="button" onClick={() => deleteById()} className="btn btn-circle btn-primary w-8 h-8 mr-4"><img className="w-6 h-6" src="/icons/trash.svg"/></button>
    </div>
  );
}


export default DeleteNoteButton;