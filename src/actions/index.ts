import { gameActions } from './game';
import { noteActions } from './note';
import { promptActions } from './prompts';

export const server = {
  ...gameActions,
  ...promptActions,
  ...noteActions
}