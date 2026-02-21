import { useCallback, useEffect, useState } from 'react';

import type { DieRoll } from '../../db/repository/dieroll';
import type { Note } from '../../db/repository/note';
import type { PromptWithRelatedRolls } from '../../db/repository/prompts';
import NoteItem from './NoteItem';
import PromptItem from './PromptItem';
import RollItem from './RollItem';
import RollTray from './RollTray';

interface Props {
  gameId: number;
  playerId: number;
  initialRolls: DieRolls;
  initialPrompts: PromptWithRelatedRolls[];
  initialNotes: Note[];
}

type DieRolls = Array<DieRoll>

type TrayEvent = DieRoll | PromptWithRelatedRolls | Note;

const fetchDieRolls = async (gameId: number): Promise<{ dieRolls: DieRolls }> => {
  const res = await fetch('/api/game/dice/' + gameId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch die rolls');
  }

  return res.json();
}

const fetchSharedNotes = async (gameId: number): Promise<{ notes: Note[] }> => {
  const res = await fetch('/api/game/notes/' + gameId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch notes for game');
  }
  return res.json();
}

const getEventTime = (event: TrayEvent) => new Date('sharedAt' in event && event.sharedAt ? event.sharedAt : event.createdAt).getTime();
const sortEventFunction = (a: TrayEvent, b: TrayEvent) => getEventTime(b) - getEventTime(a);

const mapEventsOnTray = (
  events: Array<TrayEvent>,
  playerId: number,
  settings: { hidePrompts: boolean; hideRolls: boolean, hideNotes: boolean, onlyShowMe: boolean }
) => {
  return events.sort(sortEventFunction)
    .filter(event => {
      if (settings.hideRolls) {
        if ('rollTotal' in event) {
          return false;
        };
      }
      if (settings.hidePrompts) {
        if ('characters' in event) {
          return false;
        };
      }
      if (settings.hideNotes) {
        if (('note' in event)) {
          return false;
        };
      }
      if (settings.onlyShowMe) {
        if ('rollTotal' in event) {
          return event.player.id === playerId;
        } else {
          return 'note' in event || event.playerIds.includes(playerId);
        }
      }
      return true;
    })
    .map(event => 'rollTotal' in event
      ? <RollItem key={`roll-${event.id}-${event.createdAt}`} roll={event} ownId={playerId} />
      :  'note' in event
        ? <NoteItem key={`show-note-${event.id}-${event.sharedAt}`} note={event} />
        : <PromptItem key={`prompt-${event.id}-${event.createdAt}`} prompt={event} />
    )
}

const DiceTray = ({
  gameId,
  playerId,
  initialRolls = [],
  initialPrompts = [],
  initialNotes = []
}: Props) => {
  const [rolls, setRolls] = useState<DieRolls>(initialRolls); // Fetch rolls from the database
  const [prompts] = useState<PromptWithRelatedRolls[]>(initialPrompts);
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const [hideRolls, setHideRolls] = useState(false);
  const [hidePrompts, setHidePrompts] = useState(false);
  const [hideNotes, setHideNotes] = useState(false);
  const [onlyShowMe, setOnlyShowMe] = useState(false);

  // Keep track of the latest known roll to detect new rolls
  const latestKnownRoll = rolls[0];
  const latestSharedNote = notes[0];

  const unansweredPrompts = prompts.filter(
    p => p.playerIds.includes(playerId)
      && p.relatedDieRolls.every(r => r.playerId !== playerId) // Player hasn't rolled for this prompt yet
      && new Date(p.createdAt) > new Date(Date.now() - 15 * 60 * 1000) // Created within the last 5 minutes
  );

  const syncRemoteState = async () => {
    try {
      const { dieRolls: remoteRolls } = await fetchDieRolls(gameId);
      const { notes: fetchedNotes } = await fetchSharedNotes(gameId);

      const latest = remoteRolls[0];
      const newEvents: TrayEvent[] = [];

      // Check if there's a new roll
      if (latest && (!latestKnownRoll || latest.id !== latestKnownRoll.id)) {
        newEvents.concat(updateRollState(remoteRolls));
      }
      if (fetchedNotes[0] && (!latestSharedNote || (fetchedNotes[0].id === latestSharedNote.id && fetchedNotes[0].sharedAt === latestSharedNote.sharedAt))) {
        newEvents.concat(updateNoteState(fetchedNotes));
      }

      newEvents.sort(sortEventFunction).forEach((event, index) => {
        setTimeout(() => {
          if ('note' in event) { setNotes((prevNotes) => [event, ...prevNotes]); }
          if ('rollTotal' in event) { setRolls((prevRolls) => [event, ...prevRolls]); }
        }, index * 250); // Adjust the delay as needed
      });

    } catch (error) {
      console.error('Error fetching die rolls:', error);
    }
  }

  const updateRollState = useCallback((newRolls: DieRolls) => {
    const lastIndex = newRolls.findIndex((r) => r.id === latestKnownRoll?.id);

    // We populate the tray gradually, if all rolls are new, just replace the state
    if (lastIndex === -1) { setRolls(newRolls); return newRolls;}

    // If some rolls are new, append them to the existing state with a small delay
    return newRolls.slice(0, lastIndex);
  }, [latestKnownRoll]);


  const updateNoteState = useCallback((gotNotes: Note[]) => {
    // We populate the tray gradually, if all rolls are new, just replace the state
    if (!notes.length) { setNotes(gotNotes); return gotNotes; }

    const lastIndex = gotNotes.findIndex(n => n.id === latestSharedNote?.id && n.sharedAt === latestSharedNote.sharedAt);

    // If unexpected result with the latest shared note, replace the state (source of truth is the DB)
    if (lastIndex === -1) { setNotes(gotNotes); return gotNotes; }

    // If some rolls are new, append them to the existing state with a small delay
    return gotNotes.slice(0, lastIndex);
  }, [latestSharedNote]);

  useEffect(() => {
    const interval = setInterval(() => {
      syncRemoteState();
    }, 6000)
    return () => clearInterval(interval);
  }, [rolls, gameId, playerId]);

  const allEvents = [...rolls, ...prompts, ...notes];

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex-row justify-between flex'>
        <h2 className='font-semibold text-lg'>
          Rolls & Reactions
        </h2>
        <div className="flex gap-5">
          <label className='text-sm flex gap-2'>
            <input type="checkbox" className="toggle toggle-sm toggle-primary" onChange={() => setOnlyShowMe(!onlyShowMe)} />
            Only me
          </label>
          <label className='text-sm flex gap-2'>
            <input type="checkbox" className="toggle toggle-sm toggle-primary" onChange={() => setHideNotes(!hideNotes)} />
            Hide notes
          </label>
          <label className='text-sm flex gap-2'>
            <input type="checkbox" className="toggle toggle-sm toggle-primary" onChange={() => setHidePrompts(!hidePrompts)} />
            Hide prompts
          </label>
          <label className='text-sm flex gap-2'>
            <input type="checkbox" className="toggle toggle-sm toggle-primary" onChange={() => setHideRolls(!hideRolls)} />
            Hide rolls
          </label>
        </div>
      </div>
      <RollTray gameId={gameId}
        unansweredPrompts={unansweredPrompts}
        updateParentRolls={updateRollState}
      />
      {mapEventsOnTray(allEvents, playerId, {
        hidePrompts,
        hideRolls,
        hideNotes,
        onlyShowMe
      })}
    </div>

  )
}

export default DiceTray;