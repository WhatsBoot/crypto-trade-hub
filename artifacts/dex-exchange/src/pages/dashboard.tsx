import { useGetPortfolio, useGetTransactions, useGetMarkets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { CoinLogo } from "@/components/CoinLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: portfolio, isLoading: isPortfolioLoading } = useGetPortfolio();
  const { data: transactions, isLoading: isTxLoading } = useGetTransactions();
  const { data: markets, isLoading: isMarketsLoading } = useGetMarkets();

  const sortedBalances = portfolio?.balances
    ? [...portfolio.balances].sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0))
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      {/* Total Balance + Per-Crypto Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Total Balance */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-card to-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPortfolioLoading ? (
              <Skeleton className="h-12 w-[200px]" />
            ) : (
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="text-4xl font-bold font-mono tracking-tight">
                  {formatCurrency(portfolio?.totalUsdValue || 0)}
                </div>
                {portfolio && portfolio.change24h !== undefined && (
                  <div className={cn(
                    "flex items-center text-sm font-medium",
                    portfolio.change24h >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {portfolio.change24h >= 0
                      ? <ArrowUpRight className="w-4 h-4 mr-1" />
                      : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    {Math.abs(portfolio.change24h).toFixed(2)}%
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-Crypto Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Balance by Asset</CardTitle>
            <Link href="/wallet" className="text-xs text-primary hover:underline">View wallet</Link>
          </CardHeader>
          <CardContent>
            {isPortfolioLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : sortedBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No balances yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sortedBalances.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/40 hover:border-primary/30 transition-colors">
                    <CoinLogo symbol={b.currency} size={36} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{b.currency}</div>
                      <div className="font-mono text-xs text-muted-foreground truncate">{formatNumber(b.amount)}</div>
                      <div className="text-xs text-primary font-medium">{formatCurrency(b.usdValue ?? 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Market Movers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Market Movers</CardTitle>
            <Link href="/markets" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <Activity className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {isMarketsLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : (
                markets?.slice(0, 5).map(m => (
                  <div key={m.symbol} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      <CoinLogo symbol={m.symbol} size={32} />
                      <div>
                        <div className="font-bold text-sm">{m.symbol}</div>
                        <div className="text-xs text-muted-foreground">{m.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{formatCurrency(m.price)}</div>
                      <div className={cn(
                        "text-xs font-medium",
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
            <div className="space-y-4 mt-2">
              {isTxLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : (
                transactions?.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CoinLogo symbol={tx.currency} size={28} />
                      <div>
                        <div className="font-medium capitalize text-sm">{tx.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-mono text-sm",
                        tx.type === 'withdrawal' ? "text-red-400" : "text-green-400"
                      )}>
                        {tx.type === 'withdrawal' ? '-' : '+'}{formatNumber(tx.amount)} {tx.currency}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{tx.status}</div>
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
