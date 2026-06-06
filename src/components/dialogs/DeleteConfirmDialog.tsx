import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Listing } from '@/types'

interface DeleteConfirmDialogProps {
  listing: Listing | null
  onConfirm: (id: string) => Promise<void>
  onCancel: () => void
}

export default function DeleteConfirmDialog({ listing, onConfirm, onCancel }: DeleteConfirmDialogProps) {
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
