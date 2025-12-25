import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import JourneyerDashboard from "./pages/JourneyerDashboard";
import FollowerView from "./pages/FollowerView";
import NotFound from "./pages/NotFound";
import Demo from "./pages/Demo";
import { MasterCoordinationDashboard } from "./components/MasterCoordinationDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/journey/:id" element={<FollowerView />} />
          <Route path="/dashboard" element={<JourneyerDashboard />} />
          <Route path="/coordination" element={
            <MasterCoordinationDashboard 
              currentLocation={[37.7749, -122.4194]} 
              destination={[34.0522, -118.2437]}
              journeyData={[]}
            />
          } />
          <Route path="/dashboard/coordination" element={
            <MasterCoordinationDashboard 
              currentLocation={[37.7749, -122.4194]} 
              destination={[34.0522, -118.2437]}
              journeyData={[]}
            />
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/demo" element={<Demo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
