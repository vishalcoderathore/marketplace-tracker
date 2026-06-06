import { Sun, Moon, Plus, KeyRound, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Theme } from '@/types'

interface AppHeaderProps {
  theme: Theme
  onToggleTheme: () => void
  onAddListing: () => void
  onChangePassword: () => void
  onLogout: () => void
}

export default function AppHeader({ theme, onToggleTheme, onAddListing, onChangePassword, onLogout }: AppHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">Marketplace Tracker</h1>
      <div className="flex items-center gap-2">
        <Button onClick={onAddListing}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Listing
        </Button>
        <Button variant="outline" size="icon" onClick={onChangePassword} aria-label="Change password">
          <KeyRound className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onLogout} aria-label="Log out">
          <LogOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
