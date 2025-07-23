import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Pages/Register/Register';
import Login from './Pages/Login/Login';
import Home from './Home';
import Unauthorized from './Pages/Unauthorized/Unauthorized';
import ProtectedRoute from './Components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

// Redirect to dashboard if already logged in
const AuthenticatedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <AuthenticatedRoute>
                <Login />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthenticatedRoute>
                <Register />
              </AuthenticatedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Route for Admin, Manager, and Superadmin */}
          <Route
            path="/*"
            element={
              <ProtectedRoute allowedRoles={['manager', 'superadmin']}>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
