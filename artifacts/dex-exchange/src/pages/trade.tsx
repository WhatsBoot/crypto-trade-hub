import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMarkets, useGetMarket, useGetTrades, useCreateTrade, getGetTradesQueryKey, getGetBalancesQueryKey, getGetPortfolioQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { CoinLogo } from "@/components/CoinLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Trade() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSymbol = searchParams.get("symbol") || "BTC";
  
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  const { data: markets, isLoading: isMarketsLoading } = useGetMarkets();
  const { data: market, isLoading: isMarketLoading } = useGetMarket(symbol);
  const { data: trades, isLoading: isTradesLoading } = useGetTrades();
  
  const createTrade = useCreateTrade();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (market && type === "market") {
      setPrice(market.price.toString());
    }
  }, [market, type]);

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    
    if (type === "limit" && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }

    createTrade.mutate({
      data: {
        symbol,
        side,
        amount: Number(amount),
        price: type === "limit" ? Number(price) : undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Trade executed successfully" });
        setAmount("");
        queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Trade failed", description: err.message || "An error occurred", variant: "destructive" });
      }
    });
  };

  const currentTotal = Number(amount) * (type === "market" ? (market?.price || 0) : Number(price || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Trade</h2>
        <div className="w-[200px]">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              {markets?.map(m => (
                <SelectItem key={m.symbol} value={m.symbol}>
                  <div className="flex items-center gap-2">
                    <CoinLogo symbol={m.symbol} size={18} />
                    <span>{m.symbol}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Market Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CoinLogo symbol={symbol} size={32} />
                  {symbol}/USDT
                </CardTitle>
                <CardDescription>{market?.name}</CardDescription>
              </div>
              <div className="text-right">
                {isMarketLoading ? (
                  <Skeleton className="h-8 w-[120px]" />
                ) : (
                  <>
                    <div className="text-2xl font-mono font-bold">{formatCurrency(market?.price || 0)}</div>
                    <div className={cn(
                      "text-sm font-medium",
                      (market?.change24h || 0) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {(market?.change24h || 0) >= 0 ? "+" : ""}{(market?.change24h || 0).toFixed(2)}%
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Fake chart area to look like a terminal */}
            <div className="h-[300px] w-full bg-secondary/20 border border-border/50 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <span className="text-muted-foreground font-mono text-sm relative z-10">Chart Visualization Offline</span>
            </div>
            
            <div className="mt-6 flex justify-between text-sm text-muted-foreground">
              <div>24h Vol: <span className="font-mono text-foreground">{formatCurrency(market?.volume24h || 0, 0)}</span></div>
              <div>24h High: <span className="font-mono text-foreground">{formatCurrency(market?.high24h || 0)}</span></div>
              <div>24h Low: <span className="font-mono text-foreground">{formatCurrency(market?.low24h || 0)}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card className="border-primary/20">
          <CardHeader className="pb-4">
            <Tabs value={side} onValueChange={(v) => setSide(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Buy</TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Sell</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrade} className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  type="button" 
                  variant={type === "market" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setType("market")}
                >
                  Market
                </Button>
                <Button 
                  type="button" 
                  variant={type === "limit" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setType("limit")}
                >
                  Limit
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Price (USDT)</Label>
                <Input 
                  type="number" 
                  step="any" 
                  placeholder="Price" 
                  value={type === "market" ? market?.price || "" : price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={type === "market"}
                  className="font-mono text-right"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount ({symbol})</Label>
                <Input 
                  type="number" 
                  step="any" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono text-right"
                />
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono font-medium">{formatCurrency(currentTotal)}</span>
                </div>
                <Button 
                  type="submit" 
                  className={cn(
                    "w-full font-bold font-mono text-white",
                    side === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                  )}
                  disabled={createTrade.isPending}
                >
                  {createTrade.isPending ? "PROCESSING..." : `${side.toUpperCase()} ${symbol}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isTradesLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : trades?.slice(0, 5).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 rounded bg-secondary/30 text-sm">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "font-bold uppercase w-12",
                    trade.side === "buy" ? "text-green-500" : "text-red-500"
                  )}>
                    {trade.side}
                  </span>
                  <span className="font-medium">{trade.symbol}</span>
                </div>
                <div className="font-mono">{formatNumber(trade.amount)}</div>
                <div className="font-mono text-muted-foreground">{formatCurrency(trade.price)}</div>
                <div className="font-mono">{formatCurrency(trade.total)}</div>
                <div className="text-xs uppercase text-muted-foreground">{trade.status}</div>
              </div>
            ))}
            {trades?.length === 0 && <div className="text-center text-muted-foreground py-4">No recent trades found.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
