/**
 * Network utility module providing fetchWithTimeout with standard AbortController timeout.
 */

export async function fetchWithTimeout(
  input: string | URL | globalThis.Request,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const signal = init?.signal
      ? (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal && typeof (AbortSignal as any).any === 'function'
          ? (AbortSignal as any).any([init.signal, controller.signal])
          : controller.signal)
      : controller.signal;

    const response = await globalThis.fetch(input, {
      ...init,
      signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default fetchWithTimeout;
