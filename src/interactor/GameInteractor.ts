import { EventEmitter } from "events";

// import {
//   type Die,
//   type DieRoll,
//   getDierollsInGame,
// } from "../db/repository/dieroll";
// import {
//   getPromptsWithRelatedRolls,
//   type PromptWithRelatedRolls,
// } from "../db/repository/prompts";
// import { getCurrentPlayerId } from "../db/utils/session";
// import type { DieType } from "../tools/dice";

type CallbackFn = (msg: "roll" | "prompt") => void;

export class TestController {
  private static instance: TestController;
  private emitter = new EventEmitter();

  private constructor() {}

  private messages: string[] = [];
  private listeners = new Map<number, CallbackFn>();

  static getInstance(): TestController {
    if (!TestController.instance) {
      TestController.instance = new TestController();
    }
    return TestController.instance;
  }

  // We'll want to expand this to create connections per game
  public subscribe(playerId: number, callback: CallbackFn): void {
    console.log("Subscribing player", playerId);
    const existing = this.listeners.get(playerId);
    if (existing) {
      this.emitter.off("message", existing);
    }

    this.listeners.set(playerId, callback);
    this.emitter.on("message", callback);
  }

  public unsubscribe(playerId: number, callback: CallbackFn): void {
    console.log("Unsubscribing player", playerId);
    this.listeners.delete(playerId);
    this.emitter.off("message", callback);
  }

  public addMessage(message: string): void {
    this.messages.push(message);
    this.emitter.emit("message", message);
  }

  public getMessages() {
    return this.messages;
  }
}
