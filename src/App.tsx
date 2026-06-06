import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import { supabase, isConfigured } from './lib/supabase'
import { useTheme } from './hooks/useTheme'
import { useToastPosition } from './hooks/useToastPosition'
import { getSession, clearSession } from './lib/auth'
import type { AuthState, Listing, PriceHistoryEntry, ListingForm } from './types'
import SetupScreen from './components/auth/SetupScreen'
import LoginScreen from './components/auth/LoginScreen'
import LoggedOutScreen from './components/auth/LoggedOutScreen'
import AppHeader from './components/AppHeader'
import StatsCards from './components/StatsCards'
import ListingsTable from './components/ListingsTable'
import AddListingDialog from './components/dialogs/AddListingDialog'
import EditListingDialog from './components/dialogs/EditListingDialog'
import DeleteConfirmDialog from './components/dialogs/DeleteConfirmDialog'
import ChangePasswordDialog from './components/dialogs/ChangePasswordDialog'

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
    setAuthState('logged-out')
  }

  async function fetchListings() {
    const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    setListings(data ?? [])
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
    setPriceHistory(data ?? [])
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
  const futureEarnings = listings.filter((l) => l.status === 'active').reduce((sum, l) => sum + parseFloat(String(l.price)), 0)
  const filteredListings = statusFilter === 'all' ? listings : listings.filter((l) => l.status === statusFilter)

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (authState === 'setup') return <SetupScreen onSetup={handleAuthSuccess} />
  if (authState === 'logged-out') return <LoggedOutScreen onLogin={() => setAuthState('login')} />
  if (authState === 'login') return <LoginScreen onLogin={handleAuthSuccess} />

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AppHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          onAddListing={() => setShowAddDialog(true)}
          onChangePassword={() => setShowChangePassword(true)}
          onLogout={handleLogout}
        />
        <StatsCards
          activeCount={activeCount}
          soldCount={soldCount}
          totalEarned={totalEarned}
          futureEarnings={futureEarnings}
        />
        <ListingsTable
          loading={loading}
          listings={listings}
          filteredListings={filteredListings}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onMarkAsSold={markAsSold}
          onEdit={openEditDialog}
          onDelete={setListingToDelete}
        />
      </div>

      <ToastContainer position={toastPosition} theme={theme} autoClose={3000} closeOnClick pauseOnHover />
      <AddListingDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={addListing} />
      <EditListingDialog listing={listingToEdit} priceHistory={priceHistory} loadingHistory={loadingHistory} onSave={editListing} onClose={() => { setListingToEdit(null); setPriceHistory([]) }} />
      <DeleteConfirmDialog listing={listingToDelete} onConfirm={deleteListing} onCancel={() => setListingToDelete(null)} />
      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
    </div>
  )
}
