import { useCallback, useEffect, useState } from 'react';

import type { DieRoll } from '../../db/repository/dieroll';
import type { PromptWithRelatedRolls } from '../../db/repository/prompts';
import PromptItem from './PromptItem';
import RollItem from './RollItem';
import RollTray from './RollTray';

interface Props {
  gameId: number;
  playerId: number;
  initialRolls: DieRolls;
  initialPrompts: PromptWithRelatedRolls[];
}

type DieRolls = Array<DieRoll>


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

const mapEventsOnTray = (
  events: Array<DieRoll | PromptWithRelatedRolls>,
  playerId: number,
  settings: { hidePrompts: boolean; hideRolls: boolean, onlyShowMe: boolean }
) => {
  return events.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  })
    .filter(event => {
      if (settings.hideRolls) {
        if ('rollTotal' in event) {
          return false;
        };
      }
      if (settings.hidePrompts) {
        if (!('rollTotal' in event)) {
          return false;
        };
      }
      if (settings.onlyShowMe) {
        if ('rollTotal' in event) {
          return event.player.id === playerId;
        } else {
          return event.playerIds.includes(playerId);
        }
      }
      return true;
    })
    .map(event => 'rollTotal' in event
      ? <RollItem key={`roll-${event.id}-${event.createdAt}`} roll={event} ownId={playerId} />
      : <PromptItem key={`prompt-${event.id}-${event.createdAt}`} prompt={event} />
    )
}

const DiceTray = ({
  gameId,
  playerId,
  initialRolls = [],
  initialPrompts = []
}: Props) => {
  const [rolls, setRolls] = useState<DieRolls>(initialRolls); // Fetch rolls from the database
  const [prompts] = useState<PromptWithRelatedRolls[]>(initialPrompts);

  const [hideRolls, setHideRolls] = useState(false);
  const [hidePrompts, setHidePrompts] = useState(false);
  const [onlyShowMe, setOnlyShowMe] = useState(false);

  // Keep track of the latest known roll to detect new rolls
  const latestKnownRoll = rolls[0];
  const unansweredPrompts = prompts.filter(
    p => p.playerIds.includes(playerId)
      && p.relatedDieRolls.every(r => r.playerId !== playerId) // Player hasn't rolled for this prompt yet
      && new Date(p.createdAt) > new Date(Date.now() - 15 * 60 * 1000) // Created within the last 5 minutes
  );

  const syncRemoteState = async () => {
    try {
      const { dieRolls: remoteRolls } = await fetchDieRolls(gameId);

      const latest = remoteRolls[0];

      // Check if there's a new roll
      if (latest && (!latestKnownRoll || latest.id !== latestKnownRoll.id)) {
        updateRollState(remoteRolls);
      }

    } catch (error) {
      console.error('Error fetching die rolls:', error);
    }
  }

  const updateRollState = useCallback((newRolls: DieRolls) => {
    const lastIndex = newRolls.findIndex((r) => r.id === latestKnownRoll.id)

    // We populate the tray gradually, if all rolls are new, just replace the state
    if (lastIndex === -1) {
      return setRolls(newRolls);
    }

    // If some rolls are new, append them to the existing state with a small delay
    const rollsToAdd = newRolls.slice(0, lastIndex);

    rollsToAdd.forEach((roll, index) => {
      setTimeout(() => {
        setRolls((prevRolls) => [roll, ...prevRolls]);
      }, index * 250); // Adjust the delay as needed
    });
  }, [latestKnownRoll]);



  useEffect(() => {
    const interval = setInterval(() => {
      syncRemoteState();
    }, 6000)
    return () => clearInterval(interval);
  }, [rolls, gameId, playerId]);

  const allEvents = [...rolls, ...prompts];

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
        onlyShowMe
      })}
    </div>

  )
}

export default DiceTray;