import type { PromptWithRelatedRolls } from '../../db/repository/prompts';

interface Props {
  prompt: PromptWithRelatedRolls;
  ownId: number;
}

const PromptItem = ({ prompt }: Props) => {
  return (
    <div className='flex flex-col w-full p-3 gap-2 rounded-md bg-primary/5'>
      <div className='text-sm text-success'>
        Prompt for {prompt.playerIds.length} player{prompt.playerIds.length !== 1 ? 's' : ''}{' '}
      </div>
      <div className='font-semibold text-sm'>
        {prompt.prompt}
      </div>
      {prompt.relatedDieRolls.length > 0 && (
        <div className='text-xs opacity-70'>
          {prompt.relatedDieRolls.length} response{prompt.relatedDieRolls.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default PromptItem;
