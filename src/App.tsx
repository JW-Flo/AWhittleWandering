import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { PageLoadingSkeleton, DashboardLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Car } from "lucide-react";
import BetaGate from "@/components/BetaGate";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Explore = lazy(() => import("./pages/Explore"));
const NewJourney = lazy(() => import("./pages/NewJourney"));
const Settings = lazy(() => import("./pages/Settings"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Admin = lazy(() => import("./pages/Admin"));
const SMSTerms = lazy(() => import("./pages/SMSTerms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const DataRequest = lazy(() => import("./pages/DataRequest"));

const queryClient = new QueryClient();

// Simple loading fallback
function SimpleLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Car className="w-12 h-12 text-primary animate-pulse" />
    </div>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BetaGate>
            <BrowserRouter>
              <Routes>
                {/* Critical path - eagerly loaded */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Lazy loaded routes with appropriate loading states */}
                <Route 
                  path="/dashboard" 
                  element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Dashboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/explore" 
                  element={
                    <Suspense fallback={<PageLoadingSkeleton />}>
                      <Explore />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/journey/new" 
                  element={
                    <Suspense fallback={<SimpleLoader />}>
                      <NewJourney />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <Suspense fallback={<SimpleLoader />}>
                      <Settings />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/leaderboard" 
                  element={
                    <Suspense fallback={<SimpleLoader />}>
                      <Leaderboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Admin />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/sms-terms" 
                  element={
                    <Suspense fallback={<SimpleLoader />}>
                      <SMSTerms />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/privacy" 
                  element={
                    <Suspense fallback={<SimpleLoader />}>
                      <Privacy />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/terms" 
                  element={
                    <Suspense fallback={<SimpleLoader />}>
                      <Terms />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/data-request" 
                  element={
                    <Suspense fallback={<SimpleLoader />}>
                      <DataRequest />
                    </Suspense>
                  } 
                />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </BetaGate>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
