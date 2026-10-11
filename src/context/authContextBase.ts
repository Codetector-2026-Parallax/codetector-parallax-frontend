import { createContext } from "react"
import type { TeamProfile } from "../types/game"

export interface AuthContextValue {
  team: TeamProfile | null
  username: string | null
  isLoading: boolean
  isAuthenticated: boolean
  token: string | null
  refreshTeam: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
