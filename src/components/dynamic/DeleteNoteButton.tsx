interface Props {
  id: number;
}

const DeleteNoteButton = ({ id }: Props) => {
  return (
    <div className="tooltip" data-tip="Delete note">
      <button type="button" onClick={() => console.log('TEST DEL ' + id)} className="btn btn-circle btn-primary w-8 h-8 mr-4"><img className="w-6 h-6" src="/icons/trash.svg"/></button>
    </div>
  );
}


export default DeleteNoteButton;