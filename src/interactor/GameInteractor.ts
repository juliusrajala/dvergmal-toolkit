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

  static getInstance(): TestController {
    if (!TestController.instance) {
      TestController.instance = new TestController();
    }
    return TestController.instance;
  }

  public subscribe(callback: CallbackFn): void {
    console.log("Subscribed", this.emitter.listenerCount("message"));
    this.emitter.on("message", callback);
  }

  public unsubscribe(callback: CallbackFn): void {
    console.log("Unsubscribed", this.emitter.listenerCount("message"));
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
