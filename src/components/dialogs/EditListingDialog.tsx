import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import type { Listing, PriceHistoryEntry, ListingForm } from '@/types'

interface EditListingDialogProps {
  listing: Listing | null
  priceHistory: PriceHistoryEntry[]
  loadingHistory: boolean
  onSave: (id: string, form: ListingForm, originalPrice: number) => Promise<void>
  onClose: () => void
}

export default function EditListingDialog({
  listing,
  priceHistory,
  loadingHistory,
  onSave,
  onClose,
}: EditListingDialogProps) {
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
