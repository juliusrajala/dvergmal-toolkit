import { dieRollActions } from './dieroll';
import { gameActions } from './game';

export const server = {
  ...gameActions,
  ...dieRollActions
}