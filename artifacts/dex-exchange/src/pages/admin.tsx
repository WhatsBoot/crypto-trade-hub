import { useState } from "react";
import { 
  useAdminGetUsers, useAdminUpdateBalance, 
  useAdminGetWithdrawals, useAdminUpdateWithdrawal,
  useAdminGetSettings, useAdminUpdateSettings,
  useAdminGetStats,
  getAdminGetUsersQueryKey, getAdminGetWithdrawalsQueryKey, getAdminGetSettingsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatNumber, COINS_ORDERED } from "@/lib/utils";
import { CoinLogo } from "@/components/CoinLogo";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, ArrowUpRight, Settings as SettingsIcon, Activity } from "lucide-react";

export default function Admin() {
  const { data: stats } = useAdminGetStats();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-primary">Admin Control Panel</h2>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-mono">{stats?.totalUsers || 0}</div></CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Volume</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalVolume || 0)}</div></CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Deposited</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalDeposited || 0)}</div></CardContent>
        </Card>
        <Card className="bg-card border-primary/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Pending Withdrawals</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-mono text-primary">{stats?.pendingWithdrawals || 0}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="users" className="flex gap-2"><Users className="w-4 h-4"/> Users & Balances</TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex gap-2"><ArrowUpRight className="w-4 h-4"/> Withdrawals</TabsTrigger>
          <TabsTrigger value="settings" className="flex gap-2"><SettingsIcon className="w-4 h-4"/> Global Settings</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="withdrawals"><AdminWithdrawals /></TabsContent>
          <TabsContent value="settings"><AdminSettings /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function AdminUsers() {
  const { data: users } = useAdminGetUsers();
  const updateBalance = useAdminUpdateBalance();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState<"add" | "set" | "subtract">("add");
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    updateBalance.mutate({
      userId: selectedUser.id,
      data: {
        currency,
        amount: Number(amount),
        operation
      }
    }, {
      onSuccess: () => {
        toast({ title: "Balance updated" });
        setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error updating balance", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View users and modify their asset balances directly.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username / Email</TableHead>
              <TableHead>Total USDT Value</TableHead>
              <TableHead>Balances</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-muted-foreground">{u.id}</TableCell>
                <TableCell>
                  <div className="font-bold">{u.username}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell className="font-mono">{formatCurrency(u.totalBalanceUsdt)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {u.balances?.map(b => (
                      <span key={b.currency} className="bg-secondary px-2 py-0.5 rounded">{b.currency}: {formatNumber(b.amount)}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={isOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                    if(open) setSelectedUser(u);
                    setIsOpen(open);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Edit Balances</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Balance for {u.username}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateBalance} className="space-y-4 pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2 col-span-1">
                            <Label>Operation</Label>
                            <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
                              <SelectTrigger><SelectValue/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="add">Add (+)</SelectItem>
                                <SelectItem value="subtract">Subtract (-)</SelectItem>
                                <SelectItem value="set">Set (=)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 col-span-1">
                            <Label>Asset</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                              <SelectTrigger>
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    <CoinLogo symbol={currency} size={18} />
                                    <span>{currency}</span>
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
                          <div className="space-y-2 col-span-1">
                            <Label>Amount</Label>
                            <Input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} required />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={updateBalance.isPending}>Save Changes</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AdminWithdrawals() {
  const { data: withdrawals } = useAdminGetWithdrawals();
  const updateWithdrawal = useAdminUpdateWithdrawal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAction = (id: number, status: "approved" | "rejected") => {
    updateWithdrawal.mutate({
      id,
      data: { status }
    }, {
      onSuccess: () => {
        toast({ title: `Withdrawal ${status}` });
        queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey() });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <CardDescription>Approve or reject pending user withdrawals.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Asset & Amount</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals?.map(w => (
              <TableRow key={w.id}>
                <TableCell className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{w.username}</TableCell>
                <TableCell className="font-mono font-bold text-primary">{formatNumber(w.amount)} {w.currency}</TableCell>
                <TableCell className="font-mono text-xs">{w.toAddress}</TableCell>
                <TableCell className="uppercase text-xs font-bold">{w.status}</TableCell>
                <TableCell className="text-right">
                  {w.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-green-500 border-green-500/50 hover:bg-green-500/10" onClick={() => handleAction(w.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-500/50 hover:bg-red-500/10" onClick={() => handleAction(w.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {withdrawals?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-4">No withdrawals found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AdminSettings() {
  const { data: settings } = useAdminGetSettings();
  const updateSettings = useAdminUpdateSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    withdrawalThresholdPercent: 0,
    withdrawalMessage: "",
    walletAddress: "",
    network: ""
  });

  // Initialize form when data loads
  useState(() => {
    if (settings) {
      setFormData({
        withdrawalThresholdPercent: settings.withdrawalThresholdPercent,
        withdrawalMessage: settings.withdrawalMessage,
        walletAddress: settings.walletAddress,
        network: settings.network
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      data: {
        ...formData,
        withdrawalThresholdPercent: Number(formData.withdrawalThresholdPercent)
      }
    }, {
      onSuccess: () => {
        toast({ title: "Settings saved successfully" });
        queryClient.invalidateQueries({ queryKey: getAdminGetSettingsQueryKey() });
      }
    });
  };

  if (!settings) return null;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Platform Configuration</CardTitle>
        <CardDescription>Configure the deposit addresses and withdrawal locking system.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary border-b border-border/50 pb-2">Deposit Settings</h3>
            <div className="space-y-2">
              <Label>Platform Deposit Address (Shown to users)</Label>
              <Input 
                value={formData.walletAddress} 
                onChange={e => setFormData({...formData, walletAddress: e.target.value})} 
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Deposit Network (e.g. ERC20, TRC20)</Label>
              <Input 
                value={formData.network} 
                onChange={e => setFormData({...formData, network: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium text-destructive border-b border-border/50 pb-2">Withdrawal Lock System</h3>
            <div className="space-y-2">
              <Label>Required USDT Threshold (%)</Label>
              <Input 
                type="number" 
                value={formData.withdrawalThresholdPercent} 
                onChange={e => setFormData({...formData, withdrawalThresholdPercent: Number(e.target.value)})} 
              />
              <p className="text-xs text-muted-foreground">User needs this percentage of their total portfolio value in USDT to unlock withdrawals.</p>
            </div>
            <div className="space-y-2">
              <Label>Locked Message (Shown to users who don't meet threshold)</Label>
              <Textarea 
                value={formData.withdrawalMessage} 
                onChange={e => setFormData({...formData, withdrawalMessage: e.target.value})} 
                className="h-32"
              />
              <p className="text-xs text-muted-foreground">Use {"{required}"} to inject the dynamically calculated USDT amount they need to deposit.</p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={updateSettings.isPending}>Save Configuration</Button>
        </form>
      </CardContent>
    </Card>
  );
}
