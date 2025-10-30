import type { APIRoute } from "astro";
import EventEmitter from "events";

class TestController {
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

  public subscribe(callback: (message: string) => void): void {
    this.emitter.on("message", callback);
  }

  public unsubscribe(callback: (message: string) => void): void {
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

export const GET: APIRoute = ({ request }) => {
  const customReadable = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: string) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Subscribe to new messages
      TestController.getInstance().subscribe(sendEvent);

      request.signal.addEventListener("abort", () => {
        // Unsubscribe from new messages
        TestController.getInstance().unsubscribe(sendEvent);
        controller.close();
      });
    },
  });
  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
