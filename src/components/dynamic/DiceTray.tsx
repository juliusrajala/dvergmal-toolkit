import { useCallback, useEffect, useState } from 'react';
import type { Die, DieRoll } from '../../db/repository/dieroll';

interface Props {
  gameId: number;
  playerId: number;
  initialRolls?: DieRolls;
}

type DieRolls = Array<DieRoll>




const submitDieRoll = async (gameId: number, dice: Die[]): Promise<{ dieRolls: DieRolls }> => {
  const res = await fetch('/api/game/dice/' + gameId, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameId, dice }),
  });

  if (!res.ok) {
    throw new Error('Failed to submit die roll');
  }

  return res.json();
}

const RollTray = ({
  gameId,
}: Props) => {
  const [hand, setHand] = useState<Die[]>([]); // Fetch rolls from the database

  // Function to handle rolling dice
  const rollDice = async () => {
    try {
      const { dieRolls } = await submitDieRoll(gameId, hand);
      console.log('Submitted die roll:', dieRolls);
    } catch (error) {
      console.error('Error submitting die roll:', error);
    }
  }

  const addDieToHand = (die: number) => {
    setHand([...hand, { die, value: 1 }]);
  }

  return (
    <div className='bg-base-100 w-full p-4 rounded-lg shadow-md'>
      <div className='flex flex-row gap-2 mb-2'>
        {hand.length === 0 && <span className='italic'>No dice in hand</span>}
        {hand.map((d, index) => (
          <span key={index} className='badge badge-secondary badge-lg'>{`d${d.die}`}</span>
        ))}
      </div>
      <div className='flex w-full flex-row justify-between items-center'>
        <div className='flex flex-row gap-2'>
          <button className='btn btn-circle btn-secondary btn-sm' onClick={() => addDieToHand(4)}>d4</button>
          <button className='btn btn-circle btn-secondary btn-sm' onClick={() => addDieToHand(6)}>d6</button>
          <button className='btn btn-circle btn-secondary btn-sm' onClick={() => addDieToHand(8)}>d8</button>
          <button className='btn btn-circle btn-secondary btn-sm' onClick={() => addDieToHand(10)}>d10</button>
          <button className='btn btn-circle btn-secondary btn-sm' onClick={() => addDieToHand(12)}>d12</button>
          <button className='btn btn-circle btn-secondary btn-sm' onClick={() => addDieToHand(20)}>d20</button>
        </div>

        <button className='btn btn-primary btn-md' onClick={() => rollDice()}>Roll</button>
      </div>
    </div>
  )
}


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

const DieRoll = ({ roll, ownId }: { roll: DieRoll, ownId: number }) => {
  return (
    <div className={'flex flex-col w-full' + (roll.player.id === ownId) ? ' items-end' : ''}>

      <div className='badge badge-primary badge-lg'>{roll.rollTotal}</div>
    </div>
  )
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

      console.log('Fetched die rolls:', remoteRolls);
      const latest = remoteRolls[0];
      console.log("Latest remote roll id:", latest.id);
      console.log("Latest known roll id:", latestKnownRoll?.id);

      // Check if there's a new roll
      if (latest && (!latestKnownRoll || latest.id !== latestKnownRoll.id)) {
        console.log("New roll detected, updating state");
        updateRollState(remoteRolls);
      }

    } catch (error) {
      console.error('Error fetching die rolls:', error);
    }
  }

  const updateRollState = useCallback((newRolls: DieRolls) => {
    const lastIndex = newRolls.findIndex((r) => r.id === latestKnownRoll.id)
    console.log("Last index of known roll:", lastIndex);

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

  return (
    <div className='flex flex-col gap-2'>
      <RollTray gameId={gameId} playerId={playerId} />
      {rolls.map((r: DieRoll, index: number) => (
        <DieRoll key={`${r.id}-${r.createdAt}`} roll={r} ownId={playerId} />
      ))}
    </div>

  )
}

export default DiceTray;