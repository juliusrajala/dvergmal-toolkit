import { useState } from 'react';
import { validDice, type DieType } from '../../tools/dice';
import type { DieRoll } from '../../db/repository/dieroll';

const submitDieRoll = async (gameId: number, dice: DieType[]): Promise<{ dieRolls: Array<DieRoll> }> => {
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

interface Props {
  gameId: number;
}

const RollTray = ({
  gameId,
}: Props) => {
  const [hand, setHand] = useState<DieType[]>([]); // Fetch rolls from the database

  // Function to handle rolling dice
  const rollDice = async () => {
    try {
      const { dieRolls } = await submitDieRoll(gameId, hand);
    } catch (error) {
      console.error('Error submitting die roll:', error);
    }
  }

  const addDieToHand = (die: DieType) => {
    setHand(prev => [...prev, die]);
  }

  return (
    <div className='bg-base-100 w-full p-4 rounded-lg'>
      <div className='flex flex-row gap-2 mb-2'>
        {hand.length === 0 && <span className='italic'>No dice in hand</span>}
        {hand.map((d, index) => (
          <span key={index} className='badge badge-secondary badge-lg'>{d}</span>
        ))}
      </div>
      <div className='flex w-full flex-row justify-between items-center'>
        <div className='flex flex-row gap-2'>
          {validDice.map((die) => (
            <button key={die} className='btn btn-outline btn-sm' onClick={() => addDieToHand(die)}>{die}</button>
          ))}
        </div>

        <button className='btn btn-primary btn-md' onClick={() => rollDice()}>Roll</button>
      </div>
    </div>
  )
}

export default RollTray;