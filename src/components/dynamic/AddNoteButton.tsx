const AddNoteButton = () => {
  return (
    <div className="tooltip" data-tip="Create note">
      <button type="button" onClick={() => console.log('TEST CREATE')} className="btn btn-circle btn-primary w-8 h-8 mr-4"><img className="w-6 h-6" src="/icons/plus.svg"/></button>
    </div>
  );
}


export default AddNoteButton;