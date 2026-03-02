import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import OfflineIndicator from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";

// Public pages
import LandingIndex from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AcknowledgmentPage from "./pages/AcknowledgmentPage";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// Protected pages
import CaregiverDashboard from "./pages/CaregiverDashboard";
import SeniorHome from "./pages/SeniorHome";
import SeniorsListPage from "./pages/SeniorsListPage";
import SeniorProfilePage from "./pages/SeniorProfilePage";
import AddEditSeniorPage from "./pages/AddEditSeniorPage";
import ContactsEscalationPage from "./pages/ContactsEscalationPage";
import SeniorAlertDetail from "./pages/SeniorAlertDetail";
import ReportsPage from "./pages/ReportsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";

const queryClient = new QueryClient();

function ThemeInit() {
  useTheme();
  return null;
}

/** Wraps caregiver-only protected routes in AppShell */
function CaregiverShell({ pageTitle, children }: { pageTitle?: string; children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="caregiver">
      <AppShell pageTitle={pageTitle}>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}

/** Wraps senior-only protected routes */
function SeniorShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="senior">
      {children}
    </ProtectedRoute>
  );
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
            {/* Public routes */}
            <Route path="/" element={<LandingIndex />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/ack/:token" element={<AcknowledgmentPage />} />

            {/* Protected: Senior Home */}
            <Route path="/home" element={
              <SeniorShell>
                <SeniorHome />
              </SeniorShell>
            } />

            {/* Protected: Dashboard */}
            <Route path="/dashboard" element={
              <CaregiverShell pageTitle="Dashboard">
                <CaregiverDashboard />
              </CaregiverShell>
            } />

            {/* Protected: Seniors list */}
            <Route path="/seniors" element={
              <CaregiverShell pageTitle="Seniors">
                <SeniorsListPage />
              </CaregiverShell>
            } />
            <Route path="/seniors/new" element={
              <CaregiverShell pageTitle="Add Senior">
                <AddEditSeniorPage />
              </CaregiverShell>
            } />
            <Route path="/seniors/:id" element={
              <CaregiverShell pageTitle="Senior Profile">
                <SeniorProfilePage />
              </CaregiverShell>
            } />
            <Route path="/seniors/:id/edit" element={
              <CaregiverShell pageTitle="Edit Senior">
                <AddEditSeniorPage />
              </CaregiverShell>
            } />
            <Route path="/seniors/:id/alert" element={
              <CaregiverShell pageTitle="Alert Detail">
                <SeniorAlertDetail />
              </CaregiverShell>
            } />
            <Route path="/seniors/:id/contacts" element={
              <CaregiverShell pageTitle="Contacts & Escalation">
                <ContactsEscalationPage />
              </CaregiverShell>
            } />

            {/* Protected: Reports */}
            <Route path="/reports" element={
              <CaregiverShell pageTitle="Weekly Reports">
                <ReportsPage />
              </CaregiverShell>
            } />

            {/* Protected: Settings */}
            <Route path="/settings" element={
              <CaregiverShell pageTitle="Account Settings">
                <AccountSettingsPage />
              </CaregiverShell>
            } />
            <Route path="/settings/notifications" element={
              <CaregiverShell pageTitle="Notification Preferences">
                <AccountSettingsPage />
              </CaregiverShell>
            } />
            <Route path="/settings/billing" element={
              <CaregiverShell pageTitle="Plan & Billing">
                <AccountSettingsPage />
              </CaregiverShell>
            } />

            {/* Error routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
