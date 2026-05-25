import { useState, useEffect } from "react";
import { useGetMarkets, useGetBalances, useGetSwapQuote, useCreateSwap, getGetBalancesQueryKey, getGetPortfolioQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, cn, COINS_ORDERED } from "@/lib/utils";
import { CoinLogo } from "@/components/CoinLogo";
import { ArrowDown, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Swap() {
  const [fromCurrency, setFromCurrency] = useState("USDT");
  const [toCurrency, setToCurrency] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);

  const { data: markets } = useGetMarkets();
  const { data: balances } = useGetBalances();
  
  const getQuoteMutation = useGetSwapQuote();
  const createSwapMutation = useCreateSwap();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!(amount && Number(amount) > 0 && fromCurrency && toCurrency && fromCurrency !== toCurrency)) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(() => {
        getQuoteMutation.mutate({
          data: {
            fromCurrency: fromCurrency,
            toCurrency,
            amount: Number(amount)
          }
        }, {
          onSuccess: (data) => setQuote(data),
          onError: () => setQuote(null)
        });
      }, 500);
      return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = () => {
    if (!quote) return;
    
    createSwapMutation.mutate({
      data: {
        fromCurrency,
        toCurrency,
        amount: Number(amount)
      }
    }, {
      onSuccess: () => {
        toast({ title: "Swap executed successfully" });
        setAmount("");
        setQuote(null);
        queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPortfolioQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Swap failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleFlip = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount(quote ? quote.toAmount.toString() : "");
  };

  const fromBalance = balances?.find(b => b.currency === fromCurrency)?.amount || 0;
  const availableCurrencies = markets ? [...markets.map(m => m.symbol), "USDT"] : ["USDT", "BTC", "ETH", "SOL"];

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Swap
          </CardTitle>
          <CardDescription>Exchange tokens instantly at market rates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* FROM */}
          <div className="bg-secondary/50 p-4 rounded-xl space-y-3">
            <div className="flex justify-between">
              <Label className="text-muted-foreground">From</Label>
              <span className="text-xs text-muted-foreground">Balance: {formatNumber(fromBalance)}</span>
            </div>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-mono bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
              />
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="w-[140px] bg-background border-none shrink-0">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <CoinLogo symbol={fromCurrency} size={20} />
                      <span>{fromCurrency}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COINS_ORDERED.map(c => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <CoinLogo symbol={c} size={18} />
                        <span>{c}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center -my-6 relative z-10">
            <Button variant="outline" size="icon" className="rounded-full bg-background border-border shadow-md w-10 h-10" onClick={handleFlip}>
              <ArrowDown className="w-4 h-4 text-primary" />
            </Button>
          </div>

          {/* TO */}
          <div className="bg-secondary/50 p-4 rounded-xl space-y-3">
            <div className="flex justify-between">
              <Label className="text-muted-foreground">To (Estimated)</Label>
            </div>
            <div className="flex gap-2">
              <Input 
                type="text" 
                placeholder="0.00" 
                value={quote ? formatNumber(quote.toAmount) : ""}
                readOnly
                className="text-2xl font-mono bg-transparent border-none shadow-none focus-visible:ring-0 px-0 text-foreground"
              />
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="w-[140px] bg-background border-none shrink-0">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <CoinLogo symbol={toCurrency} size={20} />
                      <span>{toCurrency}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COINS_ORDERED.map(c => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <CoinLogo symbol={c} size={18} />
                        <span>{c}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {quote && (
            <div className="p-3 bg-background/50 rounded-lg text-sm space-y-2 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-mono">1 {quote.fromCurrency} = {formatNumber(quote.rate)} {quote.toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee ({quote.feePercent}%)</span>
                <span className="font-mono">{formatNumber(quote.fee)} {quote.fromCurrency}</span>
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter>
          <Button 
            className="w-full font-bold text-lg h-12 font-mono" 
            onClick={handleSwap}
            disabled={!quote || createSwapMutation.isPending || Number(amount) > fromBalance}
          >
            {createSwapMutation.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : Number(amount) > fromBalance ? (
              "INSUFFICIENT BALANCE"
            ) : (
              "CONFIRM SWAP"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
