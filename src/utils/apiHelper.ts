/**
 * Safe API response and error parsing utility.
 * Prevents "Unexpected token 'A', 'A server e'... is not valid JSON" errors
 * when a backend server, Vercel, or proxy returns plain text or an HTML error page.
 */

export async function getSafeErrorMessage(
  res: Response,
  fallback = 'Terjadi kesalahan pada sistem'
): Promise<string> {
  try {
    const text = await res.text();
    if (!text || text.trim() === '') {
      return `${fallback} (Status HTTP: ${res.status})`;
    }

    try {
      const json = JSON.parse(text);
      return json.error || json.message || fallback;
    } catch {
      // Response is not JSON (e.g. Vercel edge error "A server error has occurred", Nginx 502, HTML)
      if (text.includes('A server error has occurred') || text.includes('Server Error')) {
        return 'Server backend sedang mengalami kendala (500 Internal Server Error). Data Anda tetap diamankan di penyimpanan lokal.';
      }
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        return `Layanan server tidak dapat diakses atau rute belum aktif (HTTP ${res.status}).`;
      }
      // Trim if too long
      const snippet = text.replace(/<[^>]*>?/gm, '').trim();
      return `${fallback}: ${snippet.slice(0, 120)}`;
    }
  } catch {
    return fallback;
  }
}

export async function safeParseResponse<T = any>(
  res: Response,
  fallbackError = 'Gagal memproses data dari server'
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const text = await res.text();
    if (!text || text.trim() === '') {
      return {
        ok: res.ok,
        error: res.ok ? undefined : `${fallbackError} (HTTP ${res.status})`
      };
    }

    try {
      const data = JSON.parse(text);
      if (!res.ok) {
        return {
          ok: false,
          error: data.error || data.message || fallbackError
        };
      }
      return { ok: true, data };
    } catch {
      if (!res.ok) {
        if (text.includes('A server error has occurred') || text.includes('Server Error')) {
          return {
            ok: false,
            error: 'Server backend mengalami gangguan (500 Server Error).'
          };
        }
        return {
          ok: false,
          error: `${fallbackError} (HTTP ${res.status})`
        };
      }
      return {
        ok: false,
        error: 'Respons server tidak berformat JSON yang valid.'
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || fallbackError
    };
  }
}
