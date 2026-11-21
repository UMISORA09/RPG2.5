export type HomeTab = 'overview' | 'about' | 'modes' | 'preview3d' | 'contact'

export interface UserStats {
  totalFlights: number
  biomesDiscovered: string[]
}

export interface UserProfile {
  id: string
  username: string
  email?: string
  avatar: string
  isGuest?: boolean
  stats?: UserStats
}

export interface OpenWorldOptions {
  biome: string
  altitude: 'low' | 'normal' | 'high'
  speedMode: 'zen' | 'normal' | 'nitro'
  timeOfDay: 'dawn' | 'noon' | 'sunset' | 'night'
  aircraftColor?: string
}

export interface AircraftCustomization {
  color: string
  name: string
  accent: string
}

export interface FeedbackData {
  name: string
  email: string
  category: 'feedback' | 'bug' | 'feature' | 'praise'
  message: string
}
