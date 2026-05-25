import { useGetTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, Repeat, ArrowRightLeft } from "lucide-react";

export default function Transactions() {
  const { data: transactions, isLoading } = useGetTransactions();

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-4 h-4" />;
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4" />;
      case 'trade': return <ArrowRightLeft className="w-4 h-4" />;
      case 'swap': return <Repeat className="w-4 h-4" />;
      default: return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'deposit': return "bg-green-500/20 text-green-500 border-green-500/30";
      case 'withdrawal': return "bg-red-500/20 text-red-500 border-red-500/30";
      case 'trade': return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case 'swap': return "bg-purple-500/20 text-purple-500 border-purple-500/30";
      default: return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                transactions?.map(tx => (
                  <TableRow key={tx.id} className="border-border/50">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase border", getColor(tx.type))}>
                        {getIcon(tx.type)}
                        {tx.type}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{tx.currency}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {tx.type === 'withdrawal' || tx.type === 'trade' && tx.description?.includes('Sell') ? '-' : '+'}
                      {formatNumber(tx.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                      {tx.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "text-xs font-bold uppercase",
                        tx.status === 'completed' || tx.status === 'approved' ? "text-green-500" :
                        tx.status === 'rejected' || tx.status === 'failed' ? "text-red-500" :
                        "text-yellow-500"
                      )}>
                        {tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {transactions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
