/**
 * Shared helper for calling the Anthropic API from Edge Functions and
 * parsing a JSON-only response.
 *
 * Requires ANTHROPIC_API_KEY to be set as a Supabase Edge Function
 * secret (never exposed to the client).
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

/**
 * Calls Claude with a system+user prompt and parses the response as JSON.
 *
 * @param {string} system
 * @param {string} user
 * @param {number} [maxTokens]
 * @returns {Promise<any>}
 */
export async function callClaudeForJson(system, user, maxTokens = 4096) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content ?? []).find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("No text content returned from Anthropic API");
  }

  return parseJsonFromText(textBlock.text);
}

/**
 * Parses JSON from a model response, tolerating accidental markdown
 * code fences.
 *
 * @param {string} text
 * @returns {any}
 */
function parseJsonFromText(text) {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```$/, "")
      .trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse model response as JSON: ${err.message}`);
  }
}
