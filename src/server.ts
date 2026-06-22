import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // Simple server-side proxy endpoints for Google Places Web Service.
      if (url.pathname.startsWith("/api/places/autocomplete")) {
        const q = url.searchParams.get("input") || "";
        const country = url.searchParams.get("country") || "";
        const key = (env as any)?.GOOGLE_MAPS_SERVER_KEY || (env as any)?.VITE_GOOGLE_MAPS_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: 'missing_api_key' }), { status: 400 });

        const params = new URLSearchParams({ input: q, key });
        if (country) params.append('components', `country:${country}`);

        const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
        const body = await res.text();
        return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
      }

      if (url.pathname.startsWith("/api/places/details")) {
        const placeId = url.searchParams.get("place_id") || "";
        const fields = url.searchParams.get("fields") || "formatted_address,address_component";
        const key = (env as any)?.GOOGLE_MAPS_SERVER_KEY || (env as any)?.VITE_GOOGLE_MAPS_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: 'missing_api_key' }), { status: 400 });

        const params = new URLSearchParams({ place_id: placeId, key, fields });
        const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
        const body = await res.text();
        return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
