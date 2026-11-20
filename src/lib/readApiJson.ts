/** Do not expose proxy/hosting error pages, credential fragments or raw HTML. */
export async function readApiJson(response: Response): Promise<any> {
  const text = await response.text();
  if (response.status === 204 && !text.trim()) return null;
  try { return JSON.parse(text); }
  catch {
    const status = response.status;
    const temporary = status >= 500 || status === 429;
    const message = temporary
      ? `O servidor está temporariamente indisponível (HTTP ${status}). Tente novamente em instantes.`
      : 'A API não retornou JSON. Verifique se o backend foi publicado e se a rota /api está configurada na hospedagem.';
    throw Object.assign(new Error(message), { code: 'API_INVALID_RESPONSE', status });
  }
}
