import React from 'react';
import AuthCard from './AuthCard.jsx';

export default function LoginLandlord() {
  return (
    <AuthCard
      title='Log-In'
      userType='Landlord'
      fields={[
        { name: 'email', placeholder: 'Email', type: 'email' },
        { name: 'password', placeholder: 'Password', type: 'password' },
      ]}
      buttonText='Login'
    />
  );
}
