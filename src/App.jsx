import { useState, useEffect } from 'react'
import { Sun, Moon, Plus, Trash2, Pencil } from 'lucide-react'
import { supabase, isConfigured } from './lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
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
            <Input id="name" value={form.name} onChange={set('name')} placeholder="e.g. Blue Sofa" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={form.description} onChange={set('description')} placeholder="Condition, size, colour, etc." rows={3} />
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

function EditListingDialog({ listing, priceHistory, loadingHistory, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (listing) {
      setForm({
        name: listing.name,
        description: listing.description || '',
        price: parseFloat(listing.price).toFixed(2),
      })
    }
  }, [listing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(listing.id, form, listing.price)
    setSaving(false)
  }

  return (
    <Dialog open={!!listing} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Item Name *</Label>
            <Input id="edit-name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" value={form.description} onChange={set('description')} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-price">Price ($) *</Label>
            <Input id="edit-price" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
          </div>

          {/* Price history */}
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : priceHistory.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Price History</p>
              <div className="rounded-lg border border-border divide-y divide-border">
                {priceHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-3 py-2">
                    <s className="text-muted-foreground">${parseFloat(entry.price).toFixed(2)}</s>
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

function DeleteConfirmDialog({ listing, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false)
  const isSold = listing?.status === 'sold'

  const handleConfirm = async () => {
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
              <>
                This item was sold for{' '}
                <span className="font-semibold text-foreground">
                  ${parseFloat(listing?.price ?? 0).toFixed(2)}
                </span>
                . Deleting it will permanently remove it and reduce your total earned by that amount.
              </>
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
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [listingToDelete, setListingToDelete] = useState(null)
  const [listingToEdit, setListingToEdit] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

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
      setShowAddDialog(false)
    }
  }

  async function openEditDialog(listing) {
    setListingToEdit(listing)
    setLoadingHistory(true)
    const { data } = await supabase
      .from('price_history')
      .select('*')
      .eq('listing_id', listing.id)
      .order('recorded_at', { ascending: false })
    setPriceHistory(data || [])
    setLoadingHistory(false)
  }

  async function editListing(id, form, originalPrice) {
    const newPrice = parseFloat(form.price)
    const oldPrice = parseFloat(originalPrice)

    if (newPrice !== oldPrice) {
      await supabase.from('price_history').insert([{
        listing_id: id,
        price: oldPrice,
        recorded_at: new Date().toISOString(),
      }])
    }

    const now = new Date().toISOString()
    await supabase.from('listings').update({
      name: form.name,
      description: form.description,
      price: newPrice,
      updated_at: now,
    }).eq('id', id)

    setListings((prev) => prev.map((l) =>
      l.id === id ? { ...l, name: form.name, description: form.description, price: newPrice, updated_at: now } : l
    ))
    setListingToEdit(null)
    setPriceHistory([])
  }

  async function markAsSold(id) {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'sold' } : l)))
  }

  async function deleteListing(id) {
    await supabase.from('listings').delete().eq('id', id)
    setListings((prev) => prev.filter((l) => l.id !== id))
    setListingToDelete(null)
  }

  const activeCount = listings.filter((l) => l.status === 'active').length
  const soldCount = listings.filter((l) => l.status === 'sold').length
  const totalEarned = listings
    .filter((l) => l.status === 'sold')
    .reduce((sum, l) => sum + parseFloat(l.price), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace Tracker</h1>
          <div className="flex items-center gap-2">
            {isConfigured && (
              <Button onClick={() => setShowAddDialog(true)}>
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

        {/* Listings table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-12 text-sm">Loading…</p>
            ) : listings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No listings yet. Add your first item!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Listed</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[160px] truncate">
                        {listing.description || '—'}
                      </TableCell>
                      <TableCell>${parseFloat(listing.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={listing.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(listing.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(listing.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {listing.status === 'active' && (
                            <Button variant="outline" onClick={() => markAsSold(listing.id)}>
                              Mark as Sold
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(listing)}
                            aria-label="Edit listing"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setListingToDelete(listing)}
                            aria-label="Delete listing"
                          >
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

      <AddListingDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={addListing} />
      <EditListingDialog
        listing={listingToEdit}
        priceHistory={priceHistory}
        loadingHistory={loadingHistory}
        onSave={editListing}
        onClose={() => { setListingToEdit(null); setPriceHistory([]) }}
      />
      <DeleteConfirmDialog
        listing={listingToDelete}
        onConfirm={deleteListing}
        onCancel={() => setListingToDelete(null)}
      />
    </div>
  )
}
