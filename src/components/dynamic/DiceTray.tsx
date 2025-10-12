import { useCallback, useEffect, useState } from 'react';

import type { Die, DieRoll } from '../../db/repository/dieroll';
import RollItem from './RollItem';
import PromptItem from './PromptItem';
import RollTray from './RollTray';
import type { PromptWithRelatedRolls } from '../../db/repository/prompts';

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
  playerId: number
) => {
  return events.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  })
    .map(event => {
      if ('rollTotal' in event) {
        return (
          <RollItem key={`roll-${event.id}-${event.createdAt}`} roll={event} ownId={playerId} />
        )
      } else {
        return (
          <PromptItem key={`prompt-${event.id}-${event.createdAt}`} prompt={event} ownId={playerId} />
        )
      }
    });
}

const DiceTray = ({
  gameId,
  playerId,
  initialRolls = [],
  initialPrompts = []
}: Props) => {
  const [rolls, setRolls] = useState<DieRolls>(initialRolls); // Fetch rolls from the database
  const [prompts, setPrompts] = useState<PromptWithRelatedRolls[]>(initialPrompts);

        // Keep track of the latest known roll to detect new rolls
        const latestKnownRoll = rolls[0];

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
            // syncRemoteState();
          }, 6000)
          return () => clearInterval(interval);
        }, [rolls, gameId, playerId]);

        const allEvents = [...rolls, ...prompts];

        return (
          <div className='flex flex-col gap-2'>
            <RollTray gameId={gameId}
              updateParentRolls={updateRollState}
            />
            {mapEventsOnTray(allEvents, playerId)}
          </div>

        )
      }

      export default DiceTray;