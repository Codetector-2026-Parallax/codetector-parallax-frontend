export const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "")

export const WS_BASE_URL =
  (import.meta.env.VITE_WS_URL || "").trim().replace(/\/+$/, "") ||
  (API_BASE_URL.startsWith("http")
    ? API_BASE_URL.replace(/^http/, "ws")
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${API_BASE_URL}`)

const TOKEN_KEY = "codetector_access_token"

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  if (options.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const token = getStoredToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, { ...options, headers })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.", { cause: error })
    }
    throw error
  }

  // Handle 401 unauthorized
  if (response.status === 401) {
    removeStoredToken()
  }

  if (!response.ok) {
    let errorDetail = response.status >= 500
      ? "Máy chủ đang tạm thời không phản hồi. Vui lòng thử lại sau ít phút."
      : `Lỗi yêu cầu (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail
      }
    } catch {
      // not json
    }
    throw new Error(errorDetail)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
}
