import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { GoogleGenAI } from "@google/genai";

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

const SURPLUSLINK_SYSTEM_PROMPT = `
You are the official AI Assistant for SurplusLink, a platform connecting food donors with NGOs to eliminate food waste and fight hunger.

Your main goal is to guide users on how the system works:
1. Donors: Register, list surplus food batches, specify pickup time windows, and track claims.
2. NGOs: Register, undergo mandatory admin verification to ensure food safety, and browse/claim available food.
3. Logistics: Google Maps calculates driving distance between Donors and NGOs.
4. Security: Updates to sensitive profile data require Zero Trust MFA (TOTP verification codes).

Always keep answers clear, concise, and helpful. Only answer questions related to SurplusLink operations.
`;

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
    const url = new URL(request.url);

    // 1. Intercept POST /api/chat requests for Gemini AI Assistant
    if (request.method === "POST" && url.pathname === "/api/chat") {
      try {
        const body = (await request.json()) as { message?: string; history?: any[] };
        const { message, history } = body;

        if (!message) {
          return new Response(JSON.stringify({ error: "Message is required." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Retrieve API Key from standard runtime env or process.env
        const apiKey = (env as any)?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
          console.error("Gemini Configuration Error: GEMINI_API_KEY is missing from environment variables.");
          return new Response(
            JSON.stringify({ error: "Server configuration error: Missing API key." }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }

        const ai = new GoogleGenAI({ apiKey });

        // Filter & format chat history to match standard Gemini contents schema
        const formattedHistory = (history || [])
          .filter((item) => item.parts && item.parts[0]?.text?.trim() !== "")
          .map((item) => ({
            role: item.role === "assistant" ? "model" : item.role,
            parts: item.parts,
          }));

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [
            ...formattedHistory,
            { role: "user", parts: [{ text: message }] },
          ],
          config: {
            systemInstruction: SURPLUSLINK_SYSTEM_PROMPT,
            temperature: 0.2,
          },
        });

        return new Response(JSON.stringify({ reply: aiResponse.text }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      } catch (error: any) {
        console.error("Gemini API Error in server handler:", error?.message || error);
        return new Response(
          JSON.stringify({ error: error?.message || "Failed to process request with AI model." }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          }
        );
      }
    }

    // 2. Default SSR Handler Flow
    try {
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