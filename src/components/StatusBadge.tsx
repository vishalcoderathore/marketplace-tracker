export default function StatusBadge({ status }: { status: 'active' | 'sold' }) {
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
