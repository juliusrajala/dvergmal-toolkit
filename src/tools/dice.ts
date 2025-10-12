import type { Die } from '../db/repository/dieroll';

export const validDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;
export type DieType = (typeof validDice)[number];

const rollDie = (die: DieType): number => {
  const sides = parseInt(die.substring(1), 10);
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(dice: Die[]) {
  let reults = {
    total: 0,
    dies: [] as { die: number; value: number }[],
  }
  for (const die of dice) {
    const dieType = `d${die.die}` as DieType;
    if (!validDice.includes(dieType)) {
      throw new Error(`Invalid die type: ${dieType}`);
    }
    const value = rollDie(dieType);
    reults.total += value;
    reults.dies.push({ die: die.die, value });
  }

  return reults;
}