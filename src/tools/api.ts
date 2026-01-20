// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8888/.netlify/functions";
const API_TOKEN = process.env.API_TOKEN || "";

export { API_BASE_URL, API_TOKEN };

type HttpMethod = "GET" | "POST" | "PATCH";

interface ApiOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | undefined>;
  body?: Record<string, unknown>;
}

// Helper to call health dashboard APIs
export async function callApi(endpoint: string, options: ApiOptions = {}): Promise<unknown> {
  const { method = "GET", params = {}, body } = options;
  const url = new URL(`${API_BASE_URL}/${endpoint}`);

  // Add query parameters for GET requests
  if (method === "GET") {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  // Add body for POST/PATCH requests
  if ((method === "POST" || method === "PATCH") && body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`API error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

// Legacy helper for backward compatibility with existing GET-only tools
export async function callApiGet(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<unknown> {
  return callApi(endpoint, { method: "GET", params });
}
