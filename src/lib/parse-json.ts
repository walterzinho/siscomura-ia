/**
 * Shared JSON parser for LLM responses.
 * Extracts JSON from: raw string, ```json``` blocks, or first { ... } brace pair.
 * Returns null if no valid JSON is found.
 */
export function parseGeminiJson(text: string): Record<string, unknown> | null {
  if (!text || typeof text !== 'string') return null;

  // 1. Direct parse
  try { return JSON.parse(text); } catch {}

  // 2. Inside ```json ... ``` or ``` ... ```
  const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1].trim()); } catch {}
  }

  // 3. First { ... } pair
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }

  return null;
}

/**
 * Runtime-safe array extractor.
 * Given a parsed object and a key, returns a typed array or null.
 * Prevents crashes when LLM returns unexpected types.
 */
export function extractArray<T extends Record<string, unknown>>(
  obj: Record<string, unknown> | null,
  key: string
): T[] | null {
  if (!obj) return null;
  const val = obj[key];
  if (!Array.isArray(val)) return null;
  // Filter to ensure every element is a non-null object
  const filtered = val.filter(
    (item): item is T => typeof item === 'object' && item !== null && !Array.isArray(item)
  );
  return filtered.length > 0 ? filtered : null;
}
