import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { hashPassword, generateSalt } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
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
