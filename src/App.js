import { useState, useEffect } from 'react';
import './App.css';
import Homepage from './homepage.jsx';
import Login from './login.jsx';
import Register from './register.jsx';
import Dashboard from './Dashboard.jsx';
import Settings from './Settings.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import Support from './Support.jsx';
import AboutUs from './AboutUs.jsx';
import ProfilePage from './ProfilePage.jsx';
import Reviews from './Reviews.jsx';

function App() {
  const [screen, setScreen] = useState('home');
  const [dashboardType, setDashboardType] = useState('tenant'); // Track which dashboard user is on
  const [desiredDashboardNav, setDesiredDashboardNav] = useState('overview'); // Track which dashboard page to show
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const Header = () => (
    <header className="global-header">
      <div className="logo">DormScout</div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {screen === 'home' && (
          <button onClick={() => setScreen('login')} className="primary-btn">
            Login
          </button>
        )}
        {(screen === 'login' || screen === 'register' || screen === 'forgot-password') && (
          <button onClick={() => setScreen('home')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
        {screen === 'dashboard-landlord' && (
          <button onClick={() => setScreen('home')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
        {screen === 'dashboard-tenant' && (
          <button onClick={() => setScreen('home')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
        {screen === 'settings-landlord' && (
          <button onClick={() => setScreen('home')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
        {screen === 'settings-tenant' && (
          <button onClick={() => setScreen('home')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
        {(screen === 'reviews-tenant' || screen === 'reviews-landlord') && (
          <button onClick={() => setScreen('home')} className="primary-btn">
          Back to Main Menu
          </button>
        )}
      </div>
    </header>
  );

  const screens = {
    home: <Homepage />,
    auth: <Login setScreen={setScreen} />,
    login: <Login setScreen={setScreen} />,
    register: <Register setScreen={setScreen} />,
    'dashboard-landlord': <Dashboard userType="landlord" onLogout={() => setScreen('home')} setScreen={setScreen} dashboardType={setDashboardType} darkMode={darkMode} setDarkMode={setDarkMode} desiredNav={desiredDashboardNav} setDesiredNav={setDesiredDashboardNav} />,
    'dashboard-tenant': <Dashboard userType="tenant" onLogout={() => setScreen('home')} setScreen={setScreen} dashboardType={setDashboardType} darkMode={darkMode} setDarkMode={setDarkMode} desiredNav={desiredDashboardNav} setDesiredNav={setDesiredDashboardNav} />,
    'profile-landlord': <ProfilePage role="landlord" darkMode={darkMode} setScreen={setScreen} onBack={() => setScreen('dashboard-landlord')} onLogout={() => setScreen('home')} setDarkMode={setDarkMode} />,
    'profile-tenant': <ProfilePage role="tenant" darkMode={darkMode} setScreen={setScreen} onBack={() => setScreen('dashboard-tenant')} onLogout={() => setScreen('home')} setDarkMode={setDarkMode} />,
    'settings-landlord': <Settings userType="landlord" onLogout={() => setScreen('home')} setScreen={setScreen} darkMode={darkMode} setDarkMode={setDarkMode} setDesiredNav={setDesiredDashboardNav} />,
    'settings-tenant': <Settings userType="tenant" onLogout={() => setScreen('home')} setScreen={setScreen} darkMode={darkMode} setDarkMode={setDarkMode} setDesiredNav={setDesiredDashboardNav} />,
    'forgot-password': <ForgotPassword setScreen={setScreen} />,
    'support': <Support darkMode={darkMode} onBack={() => setScreen(dashboardType === 'landlord' ? 'dashboard-landlord' : 'dashboard-tenant')} />,
    'about-us': <AboutUs darkMode={darkMode} onBack={() => setScreen(dashboardType === 'landlord' ? 'dashboard-landlord' : 'dashboard-tenant')} setScreen={setScreen} />,
    'reviews-tenant': <Reviews userType="tenant" darkMode={darkMode} setDarkMode={setDarkMode} />,
    'reviews-landlord': <Reviews userType="landlord" darkMode={darkMode} setDarkMode={setDarkMode} />
  };

  return (
    <div className="app-shell">
      <Header />
      {screens[screen]}
    </div>
  );
}

export default App;
