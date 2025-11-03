import type { APIRoute } from "astro";

import { getCurrentPlayerId } from "../../../../db/utils/session";
import { TestController } from "../../../../interactor/GameInteractor";

export const POST: APIRoute = async ({ cookies, request }) => {
  const playerId = await getCurrentPlayerId(cookies);
  const body = await request.json();
  console.log("PlayerId", playerId, "body", body);

  const gameController = TestController.getInstance();
  gameController.addMessage("Test");
  return new Response(null, { status: 204 });
};

export const GET: APIRoute = async ({ cookies, request }) => {
  const playerId = await getCurrentPlayerId(cookies);
  if (!playerId) {
    return new Response(null, { status: 401 });
  }
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      const gameController = TestController.getInstance();
      console.log("Controller started");

      let closed = false;

      const write = (chunk: string) => {
        if (closed) return; // prevent writes-after-close
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // If the controller is already closed, just stop trying to write.
          closed = true;
        }
      };

      const sendEvent = (msg: "roll" | "prompt") => {
        console.log(msg, new Date());
        // SSE frame (you can also add "event: <name>\n" if you want named events)
        write(`data: ${msg}\n\n`);
      };

      // Subscribe to new messages
      gameController.subscribe(playerId, sendEvent);
      const ping = setInterval(() => write(`: ping\n\n`), 15000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(ping);
        // Important: unsubscribe using the *same* function reference
        gameController.unsubscribe(playerId, sendEvent);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      console.log("Cancel called");
    },
  });
  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
