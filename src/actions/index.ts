import { gameActions } from './game';
import { promptActions } from './prompts';

export const server = {
  ...gameActions,
  ...promptActions,
}