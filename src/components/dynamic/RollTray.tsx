import { useState } from 'react';

import type { DieRoll } from '../../db/repository/dieroll';
import type { PromptWithRelatedRolls } from '../../db/repository/prompts';
import { type DieType, validDice } from '../../tools/dice';

const submitDieRoll = async (gameId: number, dice: DieType[], promptId?: number): Promise<{ dieRolls: Array<DieRoll> }> => {
  const res = await fetch('/api/game/dice/' + gameId, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameId, dice, promptId }),
  });

  if (!res.ok) {
    throw new Error('Failed to submit die roll');
  }

  return res.json();
}

const mapMaskedDie = (die: DieType) => {
  const defaultClass = 'mask bg-secondary font-semibold text-[12px] flex items-center justify-center';
  switch (die) {
    case 'd4': return <span className={defaultClass.concat(' h-10 w-10 mask-triangle')}>{die}</span>;
    case 'd6': return <span className={defaultClass.concat(' h-8 w-8 mask-square')}>{die}</span>;
    case 'd8': return <span className={defaultClass.concat(' h-10 w-10 mask-diamond')}>{die}</span>;
    case 'd10': return <span className={defaultClass.concat(' h-10 w-10 mask-pentagon')}>{die}</span>;
    case 'd12': return <span className={defaultClass.concat(' h-10 w-10 mask-hexagon')}>{die}</span>;
    case 'd20': return <span className={defaultClass.concat(' h-10 w-10 mask-decagon')}>{die}</span>;
    case 'd100': return <span className={defaultClass.concat(' h-10 w-10 mask-circle')}>{die}</span>;
    default: return die;
  }
}

interface Props {
  gameId: number;
  unansweredPrompts: PromptWithRelatedRolls[];
  updateParentRolls: (newRolls: Array<DieRoll>) => void;
}

const RollTray = ({
  gameId,
  unansweredPrompts,
  updateParentRolls,
}: Props) => {
  const [hand, setHand] = useState<DieType[]>([]); // Fetch rolls from the database
  const [selectedPromptId, setSelectedPromptId] = useState<number | undefined>(unansweredPrompts[0]?.id);

  // Function to handle rolling dice
  const rollDice = async () => {
    try {
      const { dieRolls } = await submitDieRoll(gameId, hand, selectedPromptId);
      updateParentRolls(dieRolls);
      setHand([]); // Clear hand after rolling
    } catch (error) {
      console.error('Error submitting die roll:', error);
    }
  }

  const removeDieFromHand = (index: number) => {
    setHand(prev => prev.filter((_, i) => i !== index));
  }

  const addDieToHand = (die: DieType) => {
    setHand(prev => [...prev, die]);
  }

  const setPrompt = (promptId: number | undefined) => {
    setSelectedPromptId(promptId);
  }

  return (
    <div className='bg-base-100 w-full flex flex-col gap-5 p-4 rounded-lg'>
      <div className='flex flex-row gap-3 items-center flex-wrap'>
        {hand.length === 0 && <span className='italic'>No dice in hand</span>}
        {hand.map((d, index) => (
          <button className='btn btn-ghost p-0' onClick={() => removeDieFromHand(index)} key={index + "die-in-tray"}>{mapMaskedDie(d)}</button>
        ))}
      </div>
      <div className='flex w-full flex-col md:flex-row justify-between gap-4 md:items-center'>
        <div className='flex flex-row gap-2 flex-wrap'>
          {validDice.map((die) => (
            <button key={die} className='btn btn-outline btn-sm' onClick={() => addDieToHand(die)}>{die}</button>
          ))}
        </div>
        <div className='flex flex-row gap-2 w-full md:w-auto'>
          <select className='select select-bordered w-full md:w-48' disabled={unansweredPrompts.length === 0} value={selectedPromptId} onChange={(e) => setPrompt(Number(e.target.value) || undefined)}>
            <option>No prompt</option>
            {
              unansweredPrompts.map(p => (<option key={p.id} value={p.id}>{p.prompt}</option>))
            }
          </select>
          <button className='btn btn-primary btn-md' onClick={() => rollDice()}>Roll dice</button>
        </div>
      </div>
    </div>
  )
}

export default RollTray;