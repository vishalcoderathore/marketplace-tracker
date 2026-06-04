import { useState, useEffect } from 'react'
import { Sun, Moon, Plus } from 'lucide-react'
import { supabase, isConfigured } from './lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  )

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

function AddListingDialog({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onAdd({ ...form, price: parseFloat(form.price) })
    setForm({ name: '', description: '', price: '' })
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Blue Sofa"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={set('description')}
              placeholder="Condition, size, colour, etc."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Asking Price ($) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }) {
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

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    fetchListings()
  }, [])

  async function fetchListings() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  async function addListing(form) {
    const { data } = await supabase
      .from('listings')
      .insert([{ ...form, status: 'active' }])
      .select()
    if (data) {
      setListings((prev) => [data[0], ...prev])
      setShowDialog(false)
    }
  }

  async function markAsSold(id) {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'sold' } : l)))
  }

  const activeCount = listings.filter((l) => l.status === 'active').length
  const soldCount = listings.filter((l) => l.status === 'sold').length
  const totalEarned = listings
    .filter((l) => l.status === 'sold')
    .reduce((sum, l) => sum + parseFloat(l.price), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace Tracker</h1>
          <div className="flex items-center gap-2">
            {isConfigured && (
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Listing
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Setup notice */}
        {!isConfigured && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/40 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Setup required:</strong> Add <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to your environment variables.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-3xl font-bold">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Sold
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-3xl font-bold">{soldCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-3xl font-bold text-primary">${totalEarned.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Listings table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center text-muted-foreground py-12 text-sm">Loading…</p>
            ) : listings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                No listings yet. Add your first item!
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {listing.description || '—'}
                      </TableCell>
                      <TableCell>${parseFloat(listing.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={listing.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {listing.status === 'active' && (
                          <Button
                            variant="outline"
                            onClick={() => markAsSold(listing.id)}
                          >
                            Mark as Sold
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>

      <AddListingDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onAdd={addListing}
      />
    </div>
  )
}
