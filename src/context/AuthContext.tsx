import { useEffect, useState, useMemo, useCallback, type ReactNode } from "react"
import {
  getCurrentTeam,
  signOut as authSignOut,
} from "../services/authService"
import { getStoredToken } from "../services/apiClient"
import type { TeamProfile } from "../types/game"
import { AuthContext, type AuthContextValue } from "./authContextBase"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<TeamProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshTeam = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setTeam(null)
      setIsLoading(false)
      return
    }

    try {
      const currentTeam = await getCurrentTeam()
      setTeam(currentTeam)
    } catch {
      setTeam(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshTeam()
  }, [refreshTeam])

  const username = useMemo(() => {
    return team?.team_name || team?.username || null
  }, [team])

  const token = useMemo(() => {
    return getStoredToken()
  }, [team])

  const value = useMemo<AuthContextValue>(
    () => ({
      team,
      username,
      isLoading,
      token,
      isAuthenticated: !!team,
      refreshTeam,
      signOut: async () => {
        await authSignOut()
        setTeam(null)
      },
    }),
    [team, username, isLoading, token, refreshTeam]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
