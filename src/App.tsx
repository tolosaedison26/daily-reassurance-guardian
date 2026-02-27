import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import OfflineIndicator from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";
import Index from "./pages/Index";
import SeniorAlertDetail from "./pages/SeniorAlertDetail";
import AcknowledgmentPage from "./pages/AcknowledgmentPage";
import NotFound from "./pages/NotFound";
import ReportsPage from "./pages/ReportsPage";
import AddEditSeniorPage from "./pages/AddEditSeniorPage";
import ContactsEscalationPage from "./pages/ContactsEscalationPage";
import SeniorProfilePage from "./pages/SeniorProfilePage";

const queryClient = new QueryClient();

function ThemeInit() {
  useTheme(); // applies saved theme class on mount
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeInit />
        <OfflineIndicator />
        <InstallPrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/seniors/new" element={<AddEditSeniorPage />} />
            <Route path="/seniors/:id" element={<SeniorProfilePage />} />
            <Route path="/seniors/:id/edit" element={<AddEditSeniorPage />} />
            <Route path="/seniors/:id/alert" element={<SeniorAlertDetail />} />
            <Route path="/seniors/:id/contacts" element={<ContactsEscalationPage />} />
            <Route path="/ack/:token" element={<AcknowledgmentPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
