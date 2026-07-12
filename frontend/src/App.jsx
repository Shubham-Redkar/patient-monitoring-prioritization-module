import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import UserManagement from "./pages/UserManagement";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import PatientDetails from "./components/PatientDetails";
import DataManagement from "./pages/DataManagement";
import AccountSecurity from "./pages/AccountSecurity";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ACCESS } from "./config/clinical";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
    Loading...
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/account"
        element={<ProtectedRoute><AccountSecurity /></ProtectedRoute>}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/:patientId"
        element={
          <ProtectedRoute allowedRoles={ACCESS.PATIENT_DETAILS}>
            <PatientDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={ACCESS.USER_MANAGEMENT}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/data"
        element={
          <ProtectedRoute allowedRoles={ACCESS.DATA_MANAGEMENT}>
            <DataManagement />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
