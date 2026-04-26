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
import { AuthProvider, useAuth } from "./context/AuthContext";

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
          <ProtectedRoute allowedRoles={["admin", "doctor"]}>
            <PatientDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/data"
        element={
          <ProtectedRoute allowedRoles={["admin", "nurse"]}>
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
