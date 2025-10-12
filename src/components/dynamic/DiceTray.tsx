import { useCallback, useEffect, useState } from 'react';
import type { Die, DieRoll } from '../../db/repository/dieroll';
import RollTray from './RollTray';
import RollItem from './RollItem';

interface Props {
  gameId: number;
  playerId: number;
  initialRolls?: DieRolls;
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


const DiceTray = ({
  gameId,
  playerId,
  initialRolls = []
}: Props) => {
  const [rolls, setRolls] = useState<DieRolls>(initialRolls); // Fetch rolls from the database
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

  return (
    <div className='flex flex-col gap-2'>
      <RollTray gameId={gameId}
        updateParentRolls={updateRollState}
      />
      {rolls.map((r: DieRoll, index: number) => (
        <RollItem key={`${r.id}-${r.createdAt}`} roll={r} ownId={playerId} />
      ))}
    </div>

  )
}

export default DiceTray;