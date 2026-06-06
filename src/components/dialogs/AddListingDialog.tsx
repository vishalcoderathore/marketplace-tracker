import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ListingForm } from '@/types'

interface AddListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (form: { name: string; price: number }) => Promise<void>
}

export default function AddListingDialog({ open, onOpenChange, onAdd }: AddListingDialogProps) {
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
