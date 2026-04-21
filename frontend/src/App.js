import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import Reviews from './components/pages/Reviews/Reviews.jsx';
import Settings from './components/pages/Settings/Settings.jsx';

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
      return localStorage.getItem('darkMode') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || null;
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
    } catch (_) {}
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Simplified Header
  const Header = () => (
    <header className="global-header">
      <div className="logo">DormScout</div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {location.pathname === '/' && (
          <button onClick={() => navigate('/login')} className="primary-btn">
            Login
          </button>
        )}
        {(location.pathname === '/login' ||
          location.pathname === '/register' ||
          location.pathname === '/forgot-password') && (
          <button onClick={() => navigate('/')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
        {(location.pathname === '/dashboard' ||
          location.pathname === '/profile' ||
          location.pathname === '/settings' ||
          location.pathname === '/reviews' ||
          location.pathname === '/support' ||
          location.pathname === '/about') && (
          <button onClick={() => navigate('/')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
      </div>
    </header>
  );

  const pagesWithOwnNav = [
    '/overview', '/map', '/listing', '/booking', '/notifications', '/messages',
    '/profile', '/support', '/about', '/settings', '/reviews', '/report',
    '/', '/login', '/register', '/forgot-password',
  ];
  const showHeader = pagesWithOwnNav.includes(location.pathname);

  return (
    <AuthProvider>
      <BookingProvider>
        <div className="app-shell">
          {showHeader && <Header />}
          <Routes>
            <Route path="/" element={<Homepage key={location.key} />} />
            <Route path="/login" element={<Login setUserType={setUserType} />} />
            <Route path="/register" element={<Register setUserType={setUserType} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

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

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <Support darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<AboutUs darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            } />
            <Route path="/reviews" element={
              <ProtectedRoute>
                <Reviews userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <Report userType={userType} darkMode={darkMode} />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BookingProvider>
    </AuthProvider>

  );
}

export default App;

