function CollaborationBar({ participants = [], isOwner = false, inviteCode, setInviteCode, handleSession, handleJoin }) {
  return (
    <div className="collaboration-bar">
      {participants.map((participant) => (
        <article className="participant-box" key={participant._id ?? participant}>{participant.name ?? participant}</article>
      ))}
      {participants.length === 0 && (
        <>
          <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Room code" aria-label="Room code" />
          <br /><br />
          <button className="button button-secondary" type="button" onClick={handleJoin} disabled={!inviteCode.trim()}>
            Join Room
          </button>
        </>
      )}
      {(participants.length > 0) && <button className="button button-danger" type="button" onClick={handleSession}>
        Leave Room
      </button>}
      <br /><br />
    </div>
  );
}

export default CollaborationBar;
