import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardsProps {
  activeCount: number
  soldCount: number
  totalEarned: number
  futureEarnings: number
}

export default function StatsCards({ activeCount, soldCount, totalEarned, futureEarnings }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      <Card>
        <CardHeader className="pb-1 pt-4 px-3 sm:px-5">
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Future Earnings</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-5 pb-4 overflow-hidden">
          <p className="text-xl sm:text-3xl font-bold truncate">${futureEarnings.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
