import React from 'react';

const SECONDARY = '#5BADA8';
const PRIMARY = '#E8622E';

export default function Homepage() {
  return (
    <main className='screen home-screen'>
      <section className='hero'>
        <h1>
          Find Your Perfect Home
          <br />
          Near Campus
        </h1>
        <div className='search-wrap'>
          <input type='text' className='search-input' placeholder='Search boarding houses, dorms, or rooms' />
          <button className='primary-btn'>Search</button>
        </div>
      </section>
      <section className='features'>
        <h2>Why Choose DormScout?</h2>
        <div className='feature-grid'>
          <div className='feature-card'>
            <div className='icon' style={{ backgroundColor: SECONDARY }}>🏠</div>
            <p>Verified dorms</p>
          </div>
          <div className='feature-card'>
            <div className='icon' style={{ backgroundColor: SECONDARY }}>📍</div>
            <p>Near campus locations</p>
          </div>
          <div className='feature-card'>
            <div className='icon' style={{ backgroundColor: SECONDARY }}>💬</div>
            <p>Fast messaging</p>
          </div>
          <div className='feature-card'>
            <div className='icon' style={{ backgroundColor: SECONDARY }}>✅</div>
            <p>Trusted partners</p>
          </div>
        </div>
      </section>
    </main>
  );
}
