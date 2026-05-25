import { useGetBalances, useGetWithdrawals, useCreateWithdrawal, useCheckWithdrawalEligibility, getGetWithdrawalsQueryKey, getGetBalancesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatNumber, getCoinColor, getCoinAvatar, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AlertCircle, ArrowRightLeft, Clock, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Wallet() {
  const { data: balances, isLoading: isBalancesLoading } = useGetBalances();
  const { data: withdrawals, isLoading: isWithdrawalsLoading } = useGetWithdrawals();
  
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [eligibility, setEligibility] = useState<any>(null);

  const checkEligibility = useCheckWithdrawalEligibility();
  const createWithdrawal = useCreateWithdrawal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only check if we have amount and currency
    if (amount && Number(amount) > 0 && currency) {
      const timer = setTimeout(() => {
        checkEligibility.mutate({
          data: { currency, amount: Number(amount) }
        }, {
          onSuccess: (data) => setEligibility(data),
          onError: () => setEligibility(null)
        });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEligibility(null);
    }
  }, [amount, currency]);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility?.eligible) {
      toast({ title: "Cannot withdraw", description: eligibility?.message || "Not eligible", variant: "destructive" });
      return;
    }

    createWithdrawal.mutate({
      data: {
        currency,
        amount: Number(amount),
        toAddress,
        network: eligibility.network || "ERC20"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Withdrawal requested successfully" });
        setAmount("");
        setToAddress("");
        queryClient.invalidateQueries({ queryKey: getGetWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const availableCurrencies = balances ? balances.filter(b => b.amount > 0).map(b => b.currency) : [];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Wallet</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Asset Balances</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              {isBalancesLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : balances?.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", getCoinColor(b.currency))}>
                      {getCoinAvatar(b.currency)}
                    </div>
                    <span className="font-bold">{b.currency}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg">{formatNumber(b.amount)}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(b.usdValue || 0)}</div>
                  </div>
                </div>
              ))}
              {balances?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No assets found. Deposit funds to start trading.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Deposit Info */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" /> 
                Deposit Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Your Deposit Address (ERC20 / TRC20)</Label>
                <div className="flex">
                  <Input 
                    readOnly 
                    value={eligibility?.walletAddress || "Loading address from server..."} 
                    className="font-mono text-xs bg-background rounded-r-none border-r-0"
                  />
                  <Button variant="secondary" className="rounded-l-none" onClick={() => {
                    navigator.clipboard.writeText(eligibility?.walletAddress || "");
                    toast({ title: "Address copied" });
                  }}>Copy</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Only send supported assets to this address. Funds are credited after network confirmations.</p>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Request Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCurrencies.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                        {availableCurrencies.length === 0 && <SelectItem value="USDT">USDT</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input 
                      type="number" 
                      step="any" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Destination Address</Label>
                  <Input 
                    type="text" 
                    placeholder="0x..." 
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                {eligibility && !eligibility.eligible && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Withdrawal Locked</AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      {eligibility.message}
                    </AlertDescription>
                  </Alert>
                )}

                {eligibility && eligibility.eligible && (
                  <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
                    <ShieldCheck className="h-4 w-4" color="currentColor" />
                    <AlertTitle>Eligible for Withdrawal</AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      Your account meets the security requirements for withdrawal.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full font-mono font-bold" 
                  disabled={!eligibility?.eligible || createWithdrawal.isPending || !toAddress}
                >
                  {createWithdrawal.isPending ? "PROCESSING..." : "WITHDRAW FUNDS"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" /> Recent Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isWithdrawalsLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : withdrawals?.map(w => (
                <TableRow key={w.id}>
                  <TableCell className="text-sm text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-bold">{w.currency}</TableCell>
                  <TableCell className="font-mono">{formatNumber(w.amount)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                    {w.toAddress}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "text-xs font-bold uppercase px-2 py-1 rounded-full",
                      w.status === 'approved' ? "bg-green-500/20 text-green-500" :
                      w.status === 'rejected' ? "bg-red-500/20 text-red-500" :
                      "bg-yellow-500/20 text-yellow-500"
                    )}>
                      {w.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {withdrawals?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No withdrawal history</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
