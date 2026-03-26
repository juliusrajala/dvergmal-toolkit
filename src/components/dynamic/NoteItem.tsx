import type { Note } from '../../db/repository/note';

interface Props {
  note: Note;
}

const NoteItem = ({ note }: Props) => {
  return (
    <div className='flex flex-col w-full p-3 gap-3 rounded-md bg-primary/5'>
      { note.title && 
        <div>
          <div className='font-semibold text-sm text-success'>{note.title}</div>
          <div className="divider m-0"/>
        </div>
      }
      <div className='font-semibold text-sm text-success whitespace-pre-wrap'>{note.note}</div>
    </div>
  );
};

export default NoteItem;
