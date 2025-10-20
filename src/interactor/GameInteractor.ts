import type { AstroCookies, AstroGlobal } from "astro";

import { type DieRoll, getDierollsInGame } from "../db/repository/dieroll";
import { getPromptsWithRelatedRolls, type PromptWithRelatedRolls } from "../db/repository/prompts";
import { getCurrentPlayerId } from "../db/utils/session";

export class GameInteractor {
  private static instance: GameInteractor;
  gameId: number;

  constructor({ gameId }: { gameId: number }) {
    this.gameId = gameId
  }

  async getEvents(cookies: AstroCookies): Promise<Array<DieRoll | PromptWithRelatedRolls>> {
    const userId = await getCurrentPlayerId(cookies);
    if (!userId) {
      throw Error('Invalid user session');
    }
    const dieRolls = await getDierollsInGame(userId, this.gameId);
    const prompts = await getPromptsWithRelatedRolls(userId, this.gameId);
    return [...dieRolls, ...prompts].toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  static getInstance() {
    return this.instance
  }
}
