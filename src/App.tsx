import { lazy, Suspense } from "react";
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
import DashboardShell from "@/components/layout/DashboardShell";

// Public pages
import LandingIndex from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AcknowledgmentPage from "./pages/AcknowledgmentPage";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ContactPage from "./pages/ContactPage";

// Protected pages (senior portal)
import SeniorHome from "./pages/SeniorHome";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";
import MedicationsPage from "./pages/MedicationsPage";
import ServicesPage from "./pages/ServicesPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";

// Admin pages — lazy loaded (only admin user visits these)
const AdminShell = lazy(() => import("./components/layout/AdminShell"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminSeniors = lazy(() => import("./pages/admin/AdminSeniors"));
const AdminSeniorDetail = lazy(() => import("./pages/admin/AdminSeniorDetail"));
const AdminEmergencyContacts = lazy(() => import("./pages/admin/AdminEmergencyContacts"));

const queryClient = new QueryClient();

function ThemeInit() {
  useTheme();
  return null;
}

/** Wraps protected senior routes in DashboardShell */
function SeniorShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="senior">
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}

/** Wraps admin-only protected routes */
function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminShell>{children}</AdminShell>
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
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Protected: Senior portal (DashboardShell) */}
            <Route path="/home" element={<SeniorShell><SeniorHome /></SeniorShell>} />
            <Route path="/medications" element={<SeniorShell><MedicationsPage /></SeniorShell>} />
            <Route path="/contacts" element={<SeniorShell><EmergencyContactsPage /></SeniorShell>} />
            <Route path="/services" element={<SeniorShell><ServicesPage /></SeniorShell>} />
            <Route path="/settings" element={<SeniorShell><AccountSettingsPage /></SeniorShell>} />

            {/* Admin routes — lazy loaded */}
            <Route path="/admin" element={<Suspense fallback={null}><AdminRoute><AdminOverview /></AdminRoute></Suspense>} />
            <Route path="/admin/users" element={<Suspense fallback={null}><AdminRoute><AdminSeniors /></AdminRoute></Suspense>} />
            <Route path="/admin/users/:id" element={<Suspense fallback={null}><AdminRoute><AdminSeniorDetail /></AdminRoute></Suspense>} />
            <Route path="/admin/seniors" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/seniors/:id" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/contacts" element={<Suspense fallback={null}><AdminRoute><AdminEmergencyContacts /></AdminRoute></Suspense>} />

            {/* Legacy caregiver URLs → redirect to /home */}
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/seniors" element={<Navigate to="/home" replace />} />
            <Route path="/seniors/*" element={<Navigate to="/home" replace />} />
            <Route path="/reports" element={<Navigate to="/home" replace />} />

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
