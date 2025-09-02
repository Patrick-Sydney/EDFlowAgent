import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import RNMobilePage from "@/pages/rn-mobile";
import NotFound from "@/pages/not-found";
import TasksPage from "@/pages/tasks";
import { useTaskStore } from "./stores/taskStore";
import { seedTasksOnce } from "./demo/seedTasks";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/rn" component={RNMobilePage} />
      <Route path="/tasks" component={TasksPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const hydrateFromCache = useTaskStore(s => s.hydrateFromCache);
  
  useEffect(() => {
    // Initialize task store from cache and seed demo tasks
    hydrateFromCache();
    seedTasksOnce();
  }, [hydrateFromCache]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
