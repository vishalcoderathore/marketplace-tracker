export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row:    { id: number; password_hash: string; password_salt: string }
        Insert: { id?: number; password_hash: string; password_salt: string }
        Update: { id?: number; password_hash?: string; password_salt?: string }
      }
      listings: {
        Row:    { id: string; name: string; price: number; status: 'active' | 'sold'; created_at: string; updated_at: string | null }
        Insert: { id?: string; name: string; price: number; status?: 'active' | 'sold'; created_at?: string; updated_at?: string | null }
        Update: { id?: string; name?: string; price?: number; status?: 'active' | 'sold'; updated_at?: string | null }
      }
      price_history: {
        Row:    { id: string; listing_id: string; price: number; recorded_at: string }
        Insert: { id?: string; listing_id: string; price: number; recorded_at?: string }
        Update: { id?: string; listing_id?: string; price?: number; recorded_at?: string }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
