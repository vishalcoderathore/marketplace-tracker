export type Theme = 'light' | 'dark'
export type AuthState = 'loading' | 'setup' | 'login' | 'logged-out' | 'authenticated'
export type ToastPosition = 'top-center' | 'bottom-right'

export interface Listing {
  id: string
  name: string
  price: number
  status: 'active' | 'sold'
  created_at: string
  updated_at: string | null
}

export interface PriceHistoryEntry {
  id: string
  listing_id: string
  price: number
  recorded_at: string
}

export interface ListingForm {
  name: string
  price: string
}
