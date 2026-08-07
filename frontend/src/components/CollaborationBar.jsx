function CollaborationBar({ participants = [], isOwner = false, handleSession }) {
  return (
    <div className="collaboration-bar">
      {participants.map((participant) => (
        <article className="participant-box" key={participant._id ?? participant}>{participant.name ?? participant}</article>
      ))}
      <button className="button button-danger" type="button" onClick={handleSession}>
        Leave Room
      </button>
      <br/><br/>
    </div>
  );
}

export default CollaborationBar;
