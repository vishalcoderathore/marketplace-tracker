import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { Listing } from '@/types'

interface ListingsTableProps {
  loading: boolean
  listings: Listing[]
  filteredListings: Listing[]
  statusFilter: 'all' | 'active' | 'sold'
  onStatusFilterChange: (value: 'all' | 'active' | 'sold') => void
  onMarkAsSold: (id: string) => void
  onEdit: (listing: Listing) => void
  onDelete: (listing: Listing) => void
}

export default function ListingsTable({
  loading,
  listings,
  filteredListings,
  statusFilter,
  onStatusFilterChange,
  onMarkAsSold,
  onEdit,
  onDelete,
}: ListingsTableProps) {
  return (
    <Card>
      <div className="flex items-center justify-end px-4 py-3 border-b border-border">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'sold')}
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
                        <Button variant="outline" onClick={() => onMarkAsSold(listing.id)}>Mark as Sold</Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => onEdit(listing)} aria-label="Edit listing">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(listing)} aria-label="Delete listing">
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
  )
}
