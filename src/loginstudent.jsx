import React from 'react';
import AuthCard from './AuthCard.jsx';

export default function LoginTenant() {
  return (
    <AuthCard
      title='Log-In'
      userType='Tenant'
      fields={[
        { name: 'email', placeholder: 'Email', type: 'email' },
        { name: 'password', placeholder: 'Password', type: 'password' },
      ]}
      buttonText='Login'
    />
  );
}
