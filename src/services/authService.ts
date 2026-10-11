import {
  apiClient,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from "./apiClient"
import type { LoginResponse, TeamProfile } from "../types/game"

export function formatAuthError(error: Error | unknown): string {
  if (!error) {
    return "Đăng nhập thất bại. Vui lòng thử lại."
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin hoặc liên hệ BTC."
}

export async function signInWithUsername(
  username: string,
  password: string
): Promise<{ data: LoginResponse | null; error: Error | null }> {
  try {
    const data = await apiClient.post<LoginResponse>("/api/v1/auth/login", {
      username: username.trim(),
      password,
    })
    if (data.access_token) {
      setStoredToken(data.access_token)
    }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Đăng nhập thất bại"),
    }
  }
}

export async function signOut(): Promise<void> {
  removeStoredToken()
}

export async function getCurrentTeam(): Promise<TeamProfile | null> {
  const token = getStoredToken()
  if (!token) return null
  try {
    return await apiClient.get<TeamProfile>("/api/v1/auth/me")
  } catch {
    removeStoredToken()
    return null
  }
}
