import { useState, useEffect } from 'react';
import './App.css';
import Homepage from './homepage.jsx';
import Login from './login.jsx';
import Register from './register.jsx';
import DashboardLandlord from './DashboardLandlord.jsx';
import DashboardTenant from './DashboardTenant.jsx';
import SettingsLandlord from './SettingsLandlord.jsx';
import SettingsTenant from './SettingsTenant.jsx';

function App() {
  const [screen, setScreen] = useState('home');
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
        {(screen === 'login' || screen === 'register') && (
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
      </div>
    </header>
  );

  const screens = {
    home: <Homepage />,
    auth: <Login setScreen={setScreen} />,
    login: <Login setScreen={setScreen} />,
    register: <Register setScreen={setScreen} />,
    'dashboard-landlord': <DashboardLandlord onLogout={() => setScreen('home')} setScreen={setScreen} darkMode={darkMode} />,
    'dashboard-tenant': <DashboardTenant onLogout={() => setScreen('home')} setScreen={setScreen} darkMode={darkMode} />,
    'settings-landlord': <SettingsLandlord onLogout={() => setScreen('home')} setScreen={setScreen} darkMode={darkMode} setDarkMode={setDarkMode} />,
    'settings-tenant': <SettingsTenant onLogout={() => setScreen('home')} setScreen={setScreen} darkMode={darkMode} setDarkMode={setDarkMode} />,
  };

  return (
    <div className="app-shell">
      <Header />
      {screens[screen]}
    </div>
  );
}

export default App;
