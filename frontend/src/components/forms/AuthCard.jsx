import React from 'react';

export default function AuthCard({ title, userType, fields, buttonText }) {
  const heading = title === 'Create' ? 'Create Your Account' : 'Log-In To Your Account';
  return (
    <main className='screen auth-screen'>
      <div className='auth-card'>
        <h1>
          <span className='orange-text'>{title === 'Create' ? 'Create' : 'Log-In'}</span>{' '}
          <span className='teal-text'>{title === 'Create' ? 'Your Account' : 'To Your Account'}</span>
          <br />
          <strong>{userType}</strong>
        </h1>
        <form className='auth-form' onSubmit={(e) => e.preventDefault()}>
          {fields.map(({ name, placeholder, type = 'text' }) => (
            <input key={name} name={name} type={type} placeholder={placeholder} />
          ))}
          <button type='submit' className='primary-btn' style={{ marginTop: 14 }}>
            {buttonText}
          </button>
        </form>
      </div>
    </main>
  );
}


