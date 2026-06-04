import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import './App.css'

function AddListingModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onAdd({ ...form, price: parseFloat(form.price) })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Listing</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Blue Sofa" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={set('description')} placeholder="Condition, size, colour, etc." />
          </div>
          <div className="form-group">
            <label>Asking Price ($) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
              placeholder="0.00"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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
      setShowModal(false)
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
    <div className="app">
      <header>
        <h1>Marketplace Tracker</h1>
        {isConfigured && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add Listing
          </button>
        )}
      </header>

      {!isConfigured && (
        <div className="setup-notice">
          <strong>Setup required:</strong> Add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables to get started.
        </div>
      )}

      <div className="stats">
        <div className="stat-card">
          <div className="label">Active Listings</div>
          <div className="value">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Sold</div>
          <div className="value">{soldCount}</div>
        </div>
        <div className="stat-card earned">
          <div className="label">Total Earned</div>
          <div className="value">${totalEarned.toFixed(2)}</div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="empty">No listings yet. Add your first item!</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td><strong>{listing.name}</strong></td>
                  <td className="desc">{listing.description || '—'}</td>
                  <td>${parseFloat(listing.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${listing.status}`}>
                      {listing.status === 'active' ? 'Active' : 'Sold'}
                    </span>
                  </td>
                  <td>
                    {listing.status === 'active' && (
                      <button className="btn-sold" onClick={() => markAsSold(listing.id)}>
                        Mark as Sold
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddListingModal onAdd={addListing} onClose={() => setShowModal(false)} />}
    </div>
  )
}
