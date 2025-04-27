import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/AuthContext";
import { useAuth } from "@/lib/AuthContext";

// Layouts
import MainLayout from "@/layouts/MainLayout";

// Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import JobsPage from "@/pages/JobsPage";
import JobDetailsPage from "@/pages/JobDetailsPage";
import ProfilePage from "@/pages/ProfilePage";
import CompanyPage from "@/pages/CompanyPage";
import CompaniesPage from "@/pages/CompaniesPage";
import PostJobPage from "@/pages/PostJobPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import ApplicantsPage from "@/pages/ApplicantsPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "jobseeker" | "employer" | undefined;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // If not logged in, redirect to login page with return URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Placeholder component for routes that are not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-center text-muted-foreground mb-8">
        This feature is coming soon! We're working on making it available.
      </p>
    </div>
  );
};

// Create placeholder pages for all the missing routes
const DashboardPage = () => <PlaceholderPage title="Dashboard" />;
const ManageJobsPage = () => <PlaceholderPage title="Manage Jobs" />;
const MessagesPage = () => <PlaceholderPage title="Messages" />;
const NotificationsPage = () => <PlaceholderPage title="Notifications" />;
const AnalyticsPage = () => <PlaceholderPage title="Analytics" />;
const SettingsPage = () => <PlaceholderPage title="Account Settings" />;
const SavedJobsPage = () => <PlaceholderPage title="Saved Jobs" />;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public routes */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:id" element={<JobDetailsPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="company/:id" element={<CompanyPage />} />

            {/* Protected routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Job Seeker Routes */}
            <Route
              path="applications"
              element={
                <ProtectedRoute requiredRole="jobseeker">
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="saved-jobs"
              element={
                <ProtectedRoute requiredRole="jobseeker">
                  <SavedJobsPage />
                </ProtectedRoute>
              }
            />

            {/* Employer Routes */}
            <Route
              path="post-job"
              element={
                <ProtectedRoute requiredRole="employer">
                  <PostJobPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage-jobs"
              element={
                <ProtectedRoute requiredRole="employer">
                  <ManageJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="applicants"
              element={
                <ProtectedRoute requiredRole="employer">
                  <ApplicantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedRoute requiredRole="employer">
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Common Protected Routes */}
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
