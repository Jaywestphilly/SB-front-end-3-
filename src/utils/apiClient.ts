/**
 * Shared API Client with Graceful Paywall & Configuration Error Handling
 * 
 * Handles x402 payment requirements (HTTP 402) and configuration errors (HTTP 500 CONFIGURATION_ERROR)
 * across Stock Bloc data widgets.
 */

export interface ApiFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isPaywall: boolean;
  isConfigError: boolean;
  rawResponse?: Response;
}

export async function fetchWithPaywallHandling<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiFetchResult<T>> {
  const headers = new Headers(init?.headers || {});
  
  // Ensure same-origin browser identify headers are present
  if (!headers.has('x-stockbloc-client')) {
    headers.set('x-stockbloc-client', 'web-ui');
  }

  try {
    const res = await fetch(input, {
      ...init,
      headers,
    });

    // 1. Paywall (HTTP 402)
    if (res.status === 402) {
      let errBody: any = null;
      try {
        errBody = await res.json();
      } catch {
        // ignore json parse error
      }

      return {
        ok: false,
        status: 402,
        data: null,
        error: errBody?.message || "Unlock live data with Quant Suite Pro — $5/mo",
        isPaywall: true,
        isConfigError: false,
        rawResponse: res,
      };
    }

    // 2. Configuration Error or Server Error (HTTP 500)
    if (res.status === 500) {
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore json parse error
      }

      const isConfig =
        json?.code === "CONFIGURATION_ERROR" ||
        json?.status === "error" && json?.code === "CONFIGURATION_ERROR" ||
        (typeof json?.message === "string" && json.message.includes("CONFIGURATION_ERROR"));

      return {
        ok: false,
        status: 500,
        data: null,
        error: isConfig ? "Data temporarily unavailable" : (json?.message || "Internal Server Error"),
        isPaywall: false,
        isConfigError: isConfig,
        rawResponse: res,
      };
    }

    // 3. Other Non-OK status
    if (!res.ok) {
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: json?.message || `Request failed with status ${res.status}`,
        isPaywall: false,
        isConfigError: false,
        rawResponse: res,
      };
    }

    // 4. Success OK
    const data = (await res.json()) as T;
    return {
      ok: true,
      status: res.status,
      data,
      isPaywall: false,
      isConfigError: false,
      rawResponse: res,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "Network connection failed",
      isPaywall: false,
      isConfigError: false,
    };
  }
}
