import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import JourneyerDashboard from "./pages/JourneyerDashboard";
import FollowerView from "./pages/FollowerView";
import ExploreJourney from "./pages/ExploreJourney";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Demo from "./pages/Demo";
import { MasterCoordinationDashboard } from "./components/MasterCoordinationDashboard";

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error boundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground">
              The app encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:bg-primary focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Toaster />
        <BrowserRouter>
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/journey/:id" element={<FollowerView />} />
              <Route path="/dashboard" element={<JourneyerDashboard />} />
              <Route path="/dashboard/coordination" element={
                <MasterCoordinationDashboard
                  currentLocation={[37.7749, -122.4194]}
                  destination={[34.0522, -118.2437]}
                  journeyData={[]}
                />
              } />
              <Route path="/explore" element={<ExploreJourney />} />
              <Route path="/explore/:id" element={<ExploreJourney />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="/demo" element={<Demo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
