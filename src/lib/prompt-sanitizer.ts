/**
 * Sanitizes user prompts to prevent prompt injection attacks.
 * Wraps user input in XML tags and strips dangerous patterns.
 */

const DANGEROUS_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?)/gi,
  /you\s+are\s+(now|no\s+longer)/gi,
  /new\s+(instructions?|prompt|system)/gi,
  /system\s*(prompt|instruction)/gi,
  /<\/?system>/gi,
  /<\/?instruction>/gi,
  / forget\s+(everything|all|previous)/gi,
  /disregard\s+(previous|all|your)/gi,
  /override\s+(system|previous|all)/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /act\s+as\s+if\s+you\s+are/gi,
  /you\s+are\s+a\s+(helpful|evil|rogue|unrestricted)/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
];

/**
 * Sanitizes a user prompt by removing potential injection patterns.
 * This is a defense-in-depth measure, not a replacement for proper
 * system prompt design.
 */
export function sanitizePrompt(input: string): string {
  let sanitized = input;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REMOVED]');
  }

  return sanitized.trim();
}

/**
 * Wraps a user prompt in XML tags to create a clear boundary
 * between user input and system instructions.
 */
export function wrapUserPrompt(prompt: string): string {
  const sanitized = sanitizePrompt(prompt);
  return `<user_input>\n${sanitized}\n</user_input>`;
}
