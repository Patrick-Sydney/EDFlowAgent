import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VitalsProvider } from "./state/VitalsContext";
import Dashboard from "@/pages/dashboard";
import RNMobilePage from "@/pages/rn-mobile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/rn" component={RNMobilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <VitalsProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </VitalsProvider>
  );
}

export default App;
