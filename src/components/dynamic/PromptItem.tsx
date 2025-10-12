import type { PromptWithRelatedRolls } from '../../db/repository/prompts';

interface Props {
  prompt: PromptWithRelatedRolls;
}

const PromptItem = ({ prompt }: Props) => {
  const { relatedDieRolls, characters } = prompt;
  const unansweredCharacters = characters.filter(c => !relatedDieRolls.some(r => r.character === c));
  return (
    <div className='flex flex-col w-full p-3 gap-3 rounded-md bg-primary/5'>
      <div className='font-semibold text-sm text-success'>
        {prompt.prompt}
      </div>
      {unansweredCharacters.length > 0 && (
        <div className=''>
          {unansweredCharacters.join(', ').concat('should respond with a roll!')}
        </div>
      )}
      {prompt.relatedDieRolls.length > 0 && (
        <div className='flex flex-row flex-wrap gap-2'>
          {relatedDieRolls.map(r =>
            <span className='text-xs opacity-70'
              key={r.playerId + r.createdAt.toISOString()}>
              {r.character} rolled {r.rollTotal}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptItem;
