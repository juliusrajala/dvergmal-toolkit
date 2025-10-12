import type { JSX } from 'astro/jsx-runtime';

import type { Die, DieRoll } from '../../db/repository/dieroll';

interface Props {
  roll: DieRoll;
  ownId: number;
}

const mapDice = (dice: Die[]) => {
  const results: JSX.Element[] = [];
  for (const [index, value] of dice.entries()) {
    results.push(<span key={index} className='badge badge-outline badge-md'>{value.die}: {value.value}</span>);
    if (index < dice.length - 1) {
      results.push(<span key={`sep-${index}`} className='font-semibold'>+</span>);
    }
  }

  return results;
}


const RollItem = ({ roll, ownId }: Props) => {
  const baseContainerClass = 'flex flex-col w-full border border-base-100 p-3 gap-2 rounded-md';
  return (
    <div className={roll.player.id === ownId ? baseContainerClass.concat(' bg-secondary/5') : baseContainerClass.concat(' bg-base-200/50')}>
      <div className='text-sm'><span className='font-semibold'>{roll.player.characterName}</span> rolled{roll.context ? ` (${roll.context}):` : ':'}</div>
      <div className='flex flex-row gap-2 items-center flex-wrap'>
        {mapDice(roll.dies)}
        <span className='flex flex-row gap-2 items-center'>
          <span className='font-semibold'>=</span>
          <div className='badge badge-primary badge-lg font-semibold'>{roll.rollTotal}</div>
        </span>
      </div>
    </div>
  )
}


export default RollItem;