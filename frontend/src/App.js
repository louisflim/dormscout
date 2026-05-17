import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import Homepage from './components/pages/Home/HomePage.jsx';
import Login from './components/pages/Auth/Login.jsx';
import Register from './components/pages/Auth/Register.jsx';
import Dashboard from './components/pages/Dashboard/Dashboard.jsx';
import ForgotPassword from './components/pages/Auth/ForgotPassword.jsx';
import Support from './components/pages/Support/Support.jsx';
import AboutUs from './components/pages/About/AboutUs.jsx';
import ProfilePage from './components/pages/Profile/ProfilePage.jsx';
import Report from './components/pages/Report/Report.jsx';
import AdminPage from './components/pages/Admin/AdminPage.jsx';
import GroqChatbot from './components/Chatbot/GroqChatbot';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme === 'true') return true;
      if (savedTheme === 'false') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (_) {
      return false;
    }
  });

  const location = useLocation();

  const AppRoutes = () => {
    const { user } = useAuth();
    const userType = user?.userType || null;

    return (
      <Routes>
        <Route path="/" element={<Homepage key={location.key} darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/login" element={<Login darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/register" element={<Register darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} setDarkMode={setDarkMode} />} />

        {/* Protected Routes */}
        <Route path="/overview" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/map" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/listing" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/booking" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/bookmarks" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/notifications" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/messages" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/settings" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />
        <Route path="/reviews" element={
            <ProtectedRoute>
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
        } />

        <Route path="/profile/:viewUserId" element={
          <ProtectedRoute>
            <ProfilePage userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        } />
        <Route path="/support" element={<Support darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/about" element={<AboutUs darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/admin" element={<AdminPage />} />

        <Route path="/report" element={
          <ProtectedRoute>
            <Report userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  };

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
    } catch (_) {}
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  return (
    <AuthProvider>
      <BookingProvider>
        <div className="app-shell">
          <AppRoutes />
          <GroqChatbot />  { }
        </div>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;

