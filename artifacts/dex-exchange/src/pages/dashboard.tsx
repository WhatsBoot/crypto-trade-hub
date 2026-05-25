import { useGetPortfolio, useGetTransactions, useGetMarkets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, getCoinAvatar, getCoinColor, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: portfolio, isLoading: isPortfolioLoading } = useGetPortfolio();
  const { data: transactions, isLoading: isTxLoading } = useGetTransactions();
  const { data: markets, isLoading: isMarketsLoading } = useGetMarkets();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      {/* Portfolio Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {isPortfolioLoading ? (
              <Skeleton className="h-12 w-[200px]" />
            ) : (
              <div className="flex items-baseline gap-4">
                <div className="text-4xl font-bold font-mono tracking-tight">
                  {formatCurrency(portfolio?.totalUsdValue || 0)}
                </div>
                {portfolio && portfolio.change24h !== undefined && (
                  <div className={cn(
                    "flex items-center text-sm font-medium",
                    portfolio.change24h >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {portfolio.change24h >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    {Math.abs(portfolio.change24h).toFixed(2)}%
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">Top Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPortfolioLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : (
              portfolio?.balances.slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", getCoinColor(b.currency))}>
                      {getCoinAvatar(b.currency)}
                    </div>
                    <span className="font-medium">{b.currency}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{formatNumber(b.amount)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(b.usdValue || 0)}</div>
                  </div>
                </div>
              ))
            )}
            {(!portfolio?.balances || portfolio.balances.length === 0) && !isPortfolioLoading && (
              <div className="text-sm text-muted-foreground text-center py-2">No balances yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Market Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Market Movers</CardTitle>
            <Link href="/markets" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <Activity className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {isMarketsLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : (
                markets?.slice(0, 4).map(m => (
                  <div key={m.symbol} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", getCoinColor(m.symbol))}>
                        {getCoinAvatar(m.symbol)}
                      </div>
                      <div>
                        <div className="font-bold">{m.symbol}</div>
                        <div className="text-xs text-muted-foreground">{m.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{formatCurrency(m.price)}</div>
                      <div className={cn(
                        "text-xs font-medium flex items-center justify-end gap-1",
                        m.change24h >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {m.change24h >= 0 ? "+" : ""}{m.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
            <Link href="/transactions" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {isTxLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : (
                transactions?.slice(0, 4).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        tx.type === 'deposit' ? "bg-green-500" :
                        tx.type === 'withdrawal' ? "bg-red-500" :
                        tx.type === 'trade' ? "bg-blue-500" : "bg-purple-500"
                      )} />
                      <div>
                        <div className="font-medium capitalize">{tx.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">
                        {tx.type === 'withdrawal' ? '-' : '+'}{formatNumber(tx.amount)} {tx.currency}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {(!transactions || transactions.length === 0) && !isTxLoading && (
                <div className="text-sm text-muted-foreground text-center py-8">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
