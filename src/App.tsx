import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Community from './pages/Community';
import Mess from './pages/Mess';
import Admin from './pages/Admin';
import Chat from './pages/Chat';
import { AnimatePresence } from 'framer-motion';
import './index.css';

import { type ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname === '/develop';

  return (
    <div className={isAuthenticated && !isAdminRoute ? "app-wrapper" : ""}>
      {isAuthenticated && !isAdminRoute && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      <div className={isAuthenticated && !isAdminRoute ? `main-content ${collapsed ? 'expanded' : ''}` : ""}>
        <AnimatePresence>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/feed" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/mess" element={<ProtectedRoute><Mess /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

            {/* Admin — completely independent, no user auth needed */}
            <Route path="/develop" element={<Admin />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
