import { useState } from 'react';
import './App.css';
import Homepage from './homepage';
import LoginLandlord from './LoginLandlord';
import LoginTenant from './LoginTenant';
import SignupLandlord from './SignupLandlord';
import SignupTenant from './SignupTenant';

function App() {
  const [screen, setScreen] = useState('home');

  const NavLink = ({ id, label }) => (
    <button
      onClick={() => setScreen(id)}
      className={`nav-link ${screen === id ? 'active' : ''}`}
      style={{ color: screen === id ? '#222' : '#555' }}
    >
      {label}
    </button>
  );

  const renderHeader = () => (
    <header className="global-header">
      <div className="logo">DormScout</div>
      <div className="links">
        <NavLink id="home" label="Home" />
        <NavLink id="login-landlord" label="Login Landlord" />
        <NavLink id="login-tenant" label="Login Tenant" />
        <NavLink id="signup-landlord" label="Sign Up Landlord" />
        <NavLink id="signup-tenant" label="Sign Up Tenant" />
      </div>
    </header>
  );

  const screens = {
    home: <Homepage />,
    'login-landlord': <LoginLandlord />,
    'login-tenant': <LoginTenant />,
    'signup-landlord': <SignupLandlord />,
    'signup-tenant': <SignupTenant />,
  };

  return (
    <div className="app-shell">
      {renderHeader()}
      {screens[screen]}
    </div>
  );
}

export default App;
