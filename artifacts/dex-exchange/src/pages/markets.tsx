import { useGetMarkets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, getCoinAvatar, getCoinColor, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Markets() {
  const { data: markets, isLoading } = useGetMarkets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Markets</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[250px]">Asset</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
                <TableHead className="text-right hidden md:table-cell">24h Volume</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Market Cap</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-[80px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-[60px] ml-auto" /></TableCell>
                    <TableCell className="text-right hidden md:table-cell"><Skeleton className="h-6 w-[100px] ml-auto" /></TableCell>
                    <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-6 w-[120px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-[80px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                markets?.map(m => (
                  <TableRow key={m.symbol} className="border-border/50 hover:bg-secondary/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", getCoinColor(m.symbol))}>
                          {getCoinAvatar(m.symbol)}
                        </div>
                        <div>
                          <div className="font-bold text-base">{m.symbol}</div>
                          <div className="text-sm text-muted-foreground">{m.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(m.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        m.change24h >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {m.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(m.change24h).toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell font-mono text-muted-foreground">
                      {formatCurrency(m.volume24h, 0)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell font-mono text-muted-foreground">
                      {m.marketCap ? formatCurrency(m.marketCap, 0) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/trade?symbol=${m.symbol}`}>
                        <Button variant="secondary" size="sm">Trade</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
