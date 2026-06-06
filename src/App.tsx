import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import { Sun, Moon, Plus, Trash2, Pencil, KeyRound, LogOut } from 'lucide-react'
import { supabase, isConfigured } from './lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Types ──────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark'
type AuthState = 'loading' | 'setup' | 'login' | 'authenticated'
type ToastPosition = 'top-center' | 'bottom-right'

interface Listing {
  id: string
  name: string
  price: number
  status: 'active' | 'sold'
  created_at: string
  updated_at: string | null
}

interface PriceHistoryEntry {
  id: string
  listing_id: string
  price: number
  recorded_at: string
}

interface ListingForm {
  name: string
  price: string
}

// ── Theme ──────────────────────────────────────────────────────────────────

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'light'
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

function useToastPosition(): ToastPosition {
  const [position, setPosition] = useState<ToastPosition>(
    () => (window.innerWidth < 768 ? 'top-center' : 'bottom-right')
  )
  useEffect(() => {
    const handler = () =>
      setPosition(window.innerWidth < 768 ? 'top-center' : 'bottom-right')
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return position
}

// ── Auth utilities ─────────────────────────────────────────────────────────

const SESSION_KEY = 'mkt_tracker_auth'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000

function getSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { expiresAt } = JSON.parse(raw) as { expiresAt: number }
    if (Date.now() > expiresAt) { localStorage.removeItem(SESSION_KEY); return false }
    return true
  } catch { return false }
}

function setSession(): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + SESSION_DURATION }))
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

async function hashPassword(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Auth screens ───────────────────────────────────────────────────────────

function SetupScreen({ onSetup }: { onSetup: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return }
    setSaving(true)
    setError('')
    const salt = generateSalt()
    const hash = await hashPassword(salt, password)
    await supabase.from('app_settings').insert([{ id: 1, password_hash: hash, password_salt: salt }])
    setSession()
    onSetup()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Set Up Password</CardTitle>
          <CardDescription>Create a password to protect your marketplace tracker.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Setting up…' : 'Set Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data } = await supabase
      .from('app_settings')
      .select('password_hash, password_salt')
      .eq('id', 1)
      .single()
    if (!data) { setError('App not configured.'); setLoading(false); return }
    const hash = await hashPassword(data.password_salt, password)
    if (hash === data.password_hash) {
      setSession()
      onLogin()
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Marketplace Tracker</CardTitle>
          <CardDescription>Enter your password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoFocus required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Checking…' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── App dialogs ────────────────────────────────────────────────────────────

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.next !== form.confirm) { setError('New passwords do not match'); return }
    if (form.next.length < 4) { setError('Password must be at least 4 characters'); return }
    setSaving(true)
    setError('')
    const { data } = await supabase.from('app_settings').select('password_hash, password_salt').eq('id', 1).single()
    if (!data) { setError('Could not load settings.'); setSaving(false); return }
    const currentHash = await hashPassword(data.password_salt, form.current)
    if (currentHash !== data.password_hash) { setError('Current password is incorrect.'); setSaving(false); return }
    const newSalt = generateSalt()
    const newHash = await hashPassword(newSalt, form.next)
    await supabase.from('app_settings').update({ password_hash: newHash, password_salt: newSalt }).eq('id', 1)
    setForm({ current: '', next: '', confirm: '' })
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setError(''); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" value={form.current} onChange={set('current')} required />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" value={form.next} onChange={set('next')} required />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input type="password" value={form.confirm} onChange={set('confirm')} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Change Password'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddListingDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (form: { name: string; price: number }) => Promise<void>
}) {
  const [form, setForm] = useState<ListingForm>({ name: '', price: '' })
  const [saving, setSaving] = useState(false)
  const set = (field: keyof ListingForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onAdd({ name: form.name, price: parseFloat(form.price) })
    setForm({ name: '', price: '' })
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add New Listing</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Item Name *</Label>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="e.g. Blue Sofa" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Asking Price ($) *</Label>
            <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Listing'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditListingDialog({
  listing,
  priceHistory,
  loadingHistory,
  onSave,
  onClose,
}: {
  listing: Listing | null
  priceHistory: PriceHistoryEntry[]
  loadingHistory: boolean
  onSave: (id: string, form: ListingForm, originalPrice: number) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ListingForm>({ name: '', price: '' })
  const [saving, setSaving] = useState(false)
  const set = (field: keyof ListingForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (listing) setForm({ name: listing.name, price: parseFloat(String(listing.price)).toFixed(2) })
  }, [listing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listing) return
    setSaving(true)
    await onSave(listing.id, form, listing.price)
    setSaving(false)
  }

  return (
    <Dialog open={!!listing} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Listing</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Item Name *</Label>
            <Input id="edit-name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-price">Price ($) *</Label>
            <Input id="edit-price" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
          </div>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : priceHistory.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Price History</p>
              <div className="rounded-lg border border-border divide-y divide-border">
                {priceHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-3 py-2">
                    <s className="text-muted-foreground">${parseFloat(String(entry.price)).toFixed(2)}</s>
                    <span className="text-sm text-muted-foreground">{formatDate(entry.recorded_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  listing,
  onConfirm,
  onCancel,
}: {
  listing: Listing | null
  onConfirm: (id: string) => Promise<void>
  onCancel: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const isSold = listing?.status === 'sold'

  const handleConfirm = async () => {
    if (!listing) return
    setDeleting(true)
    await onConfirm(listing.id)
    setDeleting(false)
  }

  return (
    <Dialog open={!!listing} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{listing?.name}&rdquo;?</DialogTitle>
          <DialogDescription className="pt-2 text-base">
            {isSold ? (
              <>This item was sold for <span className="font-semibold text-foreground">${parseFloat(String(listing?.price ?? 0)).toFixed(2)}</span>. Deleting it will permanently remove it and reduce your total earned by that amount.</>
            ) : (
              'This listing will be permanently removed. This action cannot be undone.'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, delete it'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: 'active' | 'sold' }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium"
      style={{
        background: status === 'active' ? 'var(--badge-active-bg)' : 'var(--badge-sold-bg)',
        color: status === 'active' ? 'var(--badge-active-fg)' : 'var(--badge-sold-fg)',
      }}
    >
      {status === 'active' ? 'Active' : 'Sold'}
    </span>
  )
}

// ── Main app ───────────────────────────────────────────────────────────────

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const toastPosition = useToastPosition()
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null)
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold'>('all')

  useEffect(() => {
    if (!isConfigured) { setLoading(false); setAuthState('authenticated'); return }
    initAuth()
  }, [])

  async function initAuth() {
    if (getSession()) { setAuthState('authenticated'); fetchListings(); return }
    const { data } = await supabase.from('app_settings').select('id').eq('id', 1).maybeSingle()
    setAuthState(data ? 'login' : 'setup')
  }

  function handleAuthSuccess() {
    setAuthState('authenticated')
    fetchListings()
  }

  function handleLogout() {
    clearSession()
    setListings([])
    setAuthState('login')
  }

  async function fetchListings() {
    const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    setListings((data as Listing[]) || [])
    setLoading(false)
  }

  async function addListing(form: { name: string; price: number }) {
    const { data } = await supabase.from('listings').insert([{ ...form, status: 'active' }]).select()
    if (data) { setListings((prev) => [data[0] as Listing, ...prev]); setShowAddDialog(false); toast.success('Listing added!') }
  }

  async function openEditDialog(listing: Listing) {
    setListingToEdit(listing)
    setLoadingHistory(true)
    const { data } = await supabase.from('price_history').select('*').eq('listing_id', listing.id).order('recorded_at', { ascending: false })
    setPriceHistory((data as PriceHistoryEntry[]) || [])
    setLoadingHistory(false)
  }

  async function editListing(id: string, form: ListingForm, originalPrice: number) {
    const newPrice = parseFloat(form.price)
    const oldPrice = parseFloat(String(originalPrice))
    if (newPrice !== oldPrice) {
      await supabase.from('price_history').insert([{ listing_id: id, price: oldPrice, recorded_at: new Date().toISOString() }])
    }
    const now = new Date().toISOString()
    await supabase.from('listings').update({ name: form.name, price: newPrice, updated_at: now }).eq('id', id)
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, name: form.name, price: newPrice, updated_at: now } : l))
    setListingToEdit(null)
    setPriceHistory([])
    toast.info('Listing updated')
  }

  async function markAsSold(id: string) {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'sold' } : l)))
    toast.success('Marked as sold!')
  }

  async function deleteListing(id: string) {
    await supabase.from('listings').delete().eq('id', id)
    setListings((prev) => prev.filter((l) => l.id !== id))
    setListingToDelete(null)
    toast.success('Listing deleted')
  }

  const activeCount = listings.filter((l) => l.status === 'active').length
  const soldCount = listings.filter((l) => l.status === 'sold').length
  const totalEarned = listings.filter((l) => l.status === 'sold').reduce((sum, l) => sum + parseFloat(String(l.price)), 0)
  const filteredListings = statusFilter === 'all' ? listings : listings.filter((l) => l.status === statusFilter)

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (authState === 'setup') return <SetupScreen onSetup={handleAuthSuccess} />
  if (authState === 'login') return <LoginScreen onLogin={handleAuthSuccess} />

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace Tracker</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Listing
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowChangePassword(true)} aria-label="Change password">
              <KeyRound className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-1 pt-4 px-3 sm:px-5">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Active Listings</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-5 pb-4 overflow-hidden">
              <p className="text-xl sm:text-3xl font-bold truncate">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-3 sm:px-5">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Sold</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-5 pb-4 overflow-hidden">
              <p className="text-xl sm:text-3xl font-bold truncate">{soldCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-3 sm:px-5">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-5 pb-4 overflow-hidden">
              <p className="text-xl sm:text-3xl font-bold text-primary truncate">${totalEarned.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-end px-4 py-3 border-b border-border">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'sold')}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-12 text-sm">Loading…</p>
            ) : listings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No listings yet. Add your first item!</p>
            ) : filteredListings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No {statusFilter} listings.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Listed</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.name}</TableCell>
                      <TableCell>${parseFloat(String(listing.price)).toFixed(2)}</TableCell>
                      <TableCell><StatusBadge status={listing.status} /></TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(listing.created_at)}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(listing.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {listing.status === 'active' && (
                            <Button variant="outline" onClick={() => markAsSold(listing.id)}>Mark as Sold</Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(listing)} aria-label="Edit listing">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setListingToDelete(listing)} aria-label="Delete listing">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ToastContainer position={toastPosition} theme={theme} autoClose={3000} closeOnClick pauseOnHover />
      <AddListingDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={addListing} />
      <EditListingDialog listing={listingToEdit} priceHistory={priceHistory} loadingHistory={loadingHistory} onSave={editListing} onClose={() => { setListingToEdit(null); setPriceHistory([]) }} />
      <DeleteConfirmDialog listing={listingToDelete} onConfirm={deleteListing} onCancel={() => setListingToDelete(null)} />
      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
    </div>
  )
}
