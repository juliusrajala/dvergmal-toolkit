import type { AstroGlobal } from "astro";

import { getCurrentPlayerId } from "../db/utils/session";

export async function postHandler<T>(
  request: Request,
  handler: (request: Request) => Promise<T>,
) {
  if (request.method === "POST") {
    return await handler(request);
  }
}

/**
 * Retrieves the user ID from the given Astro context and route.
 *
 * @param {object} instance - The Astro context object.
 * @param {string?} route - The redirection route string.
 * @returns {Promise<number>} userId - The user ID.
 */
export async function assertUserOrRedirect(
  instance: AstroGlobal,
  route: string = "/",
): Promise<number | Response> {
  const userId = await getCurrentPlayerId(instance.cookies);
  if (!userId) {
    return instance.redirect(route);
  }
  return userId;
}
