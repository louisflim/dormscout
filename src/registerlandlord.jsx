import React from 'react';
import AuthCard from './AuthCard.jsx';

export default function SignupLandlord() {
  return (
    <AuthCard
      title='Create'
      userType='Landlord'
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
