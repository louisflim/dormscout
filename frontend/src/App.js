import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
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

function App() {
  const [userType, setUserType] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Simplified Header matching your original
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
    '/dashboard', '/map', '/listing', '/booking', '/notifications', '/messages',
    '/profile', '/support', '/about', '/settings', '/reviews', '/report',
    '/', '/login', '/register', '/forgot-password',
  ];
  const hideGlobalHeader = pagesWithOwnNav.includes(location.pathname);

  return (
    <BookingProvider>
    <div className="app-shell">
      {!hideGlobalHeader && <Header />}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login setUserType={setUserType} />} />
        <Route path="/register" element={<Register setUserType={setUserType} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={
          userType ? (
            <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
          ) : (
            <Navigate to="/login" />
          )
        } />
        {['/map', '/listing', '/booking', '/notifications', '/messages', '/settings', '/reviews'].map(path => (
          <Route key={path} path={path} element={
            userType ? (
              <Dashboard userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            ) : (
              <Navigate to="/login" />
            )
          } />
        ))}
        <Route path="/profile" element={
          <ProfilePage userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
        } />
        <Route path="/support" element={<Support darkMode={darkMode} />} />
        <Route path="/about" element={<AboutUs darkMode={darkMode} />} />
        <Route path="/report" element={
          <Report userType={userType || 'tenant'} darkMode={darkMode} />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
    </BookingProvider>
  );
}

export default App;

