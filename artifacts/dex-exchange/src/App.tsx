import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Markets from "@/pages/markets";
import Trade from "@/pages/trade";
import Swap from "@/pages/swap";
import Wallet from "@/pages/wallet";
import Transactions from "@/pages/transactions";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { Layout } from "@/components/layout";

setAuthTokenGetter(getToken);

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  // We'll handle auth checking at the Layout level for simplicity
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/markets">
        <Layout><Markets /></Layout>
      </Route>
      <Route path="/trade">
        <Layout><Trade /></Layout>
      </Route>
      <Route path="/swap">
        <Layout><Swap /></Layout>
      </Route>
      <Route path="/wallet">
        <Layout><Wallet /></Layout>
      </Route>
      <Route path="/transactions">
        <Layout><Transactions /></Layout>
      </Route>
      <Route path="/admin">
        <Layout><Admin /></Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
