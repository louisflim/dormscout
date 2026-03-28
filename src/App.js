import { useState } from 'react';
import './App.css';
import Homepage from './homepage.jsx';
import AuthScreen from './AuthScreen.jsx';
import DashboardLandlord from './DashboardLandlord.jsx';

function App() {
  const [screen, setScreen] = useState('home');

  const Header = () => (
    <header className="global-header">
      <div className="logo">DormScout</div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {screen === 'home' && (
          <button onClick={() => setScreen('auth')} className="primary-btn">
            Login
          </button>
        )}
        {screen === 'auth' && (
          <button onClick={() => setScreen('home')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
        {screen === 'dashboard-landlord' && (
          <button onClick={() => setScreen('home')} className="primary-btn">
            Back to Main Menu
          </button>
        )}
      </div>
    </header>
  );

  const screens = {
    home: <Homepage />,
    auth: <AuthScreen setScreen={setScreen} />,
    'dashboard-landlord': <DashboardLandlord onLogout={() => setScreen('home')} />,
  };

  return (
    <div className="app-shell">
      <Header />
      {screens[screen]}
    </div>
  );
}

export default App;
