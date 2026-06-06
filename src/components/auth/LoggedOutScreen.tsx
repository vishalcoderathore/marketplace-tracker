import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoggedOutScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">You have been logged out</CardTitle>
          <CardDescription>Your session has ended.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={onLogin}>Log in</Button>
        </CardContent>
      </Card>
    </div>
  )
}
