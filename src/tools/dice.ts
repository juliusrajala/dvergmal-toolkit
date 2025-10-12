import type { Die } from '../db/repository/dieroll';

export const validDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;
export type DieType = (typeof validDice)[number];

const rollDie = (die: DieType): number => {
  console.log(`Rolling a ${die}`);
  const sides = parseInt(die.substring(1), 10);
  console.log(`Die has ${sides} sides`);
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(dice: DieType[]) {
  let results: {
    total: number;
    dice: Die[]
  } = {
    total: 0,
    dice: [] as Die[],
  }
  for (const die of dice) {
    console.log(`Processing die: ${die}`);
    if (!validDice.includes(die)) {
      throw new Error(`Invalid die type: ${die}`);
    }
    const value = rollDie(die);
    results.total += value;
    results.dice.push({ die: die, value });
  }

  console.log("Roll results:", results);

  return results;
}