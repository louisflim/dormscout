import React from 'react';
import AuthCard from './AuthCard.jsx';

export default function SignupTenant() {
  return (
    <AuthCard
      title='Create'
      userType='Tenant'
      fields={[
        { name: 'name', placeholder: 'Full Name' },
        { name: 'email', placeholder: 'Email', type: 'email' },
        { name: 'phone', placeholder: 'Phone Number', type: 'tel' },
        { name: 'password', placeholder: 'Password', type: 'password' },
      ]}
      buttonText='Sign Up'
    />
  );
}
