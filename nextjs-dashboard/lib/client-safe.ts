export function getClientErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallback: T | null = null
): Promise<{ data: T | null; error: string | null; response?: Response }> {
  try {
    const response = await fetch(input, init);

    const contentType = response.headers.get('content-type') ?? '';
    const hasJsonBody = contentType.includes('application/json');
    const payload = hasJsonBody ? await response.json() : null;

    if (!response.ok) {
      const message = payload?.message || payload?.error || `Request gagal dengan status ${response.status}.`;
      return { data: fallback, error: message, response };
    }

    return { data: (payload as T) ?? fallback, error: null, response };
  } catch (error) {
    return {
      data: fallback,
      error: getClientErrorMessage(error, 'Kesalahan jaringan atau server tidak merespons. Silakan coba lagi.'),
    };
  }
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

export function isValidEngineNumber(value: string): boolean {
  return value.trim().length >= 5;
}
