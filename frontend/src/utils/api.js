// API service for communicating with the backend

const API_BASE_URL = 'http://localhost:8080/api';

// User API calls
export const userAPI = {
  register: (userData) =>
    fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(res => res.json()),

  login: (email, password) =>
    fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => res.json()),

  getUserById: (id) =>
    fetch(`${API_BASE_URL}/users/${id}`).then(res => res.json()),

  getUserByEmail: (email) =>
    fetch(`${API_BASE_URL}/users/email/${email}`).then(res => res.json()),

  getAllUsers: () =>
    fetch(`${API_BASE_URL}/users`).then(res => res.json()),

  updateUser: (id, userData) =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(res => res.json()),

  deleteUser: (id) =>
    fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' }).then(res => res.json()),
};

// Listing API calls
export const listingsAPI = {
  createListing: (listing, landlordId) =>
    fetch(`${API_BASE_URL}/listings?landlordId=${landlordId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing),
    }).then(res => res.json()),

  getListingById: (id) =>
    fetch(`${API_BASE_URL}/listings/${id}`).then(res => res.json()),

  getAllListings: () =>
    fetch(`${API_BASE_URL}/listings`).then(res => res.json()),

  getActiveListings: () =>
    fetch(`${API_BASE_URL}/listings/active`).then(res => res.json()),

  getListingsByLandlord: (landlordId) =>
    fetch(`${API_BASE_URL}/listings/landlord/${landlordId}`).then(res => res.json()),

  updateListing: (id, listing) =>
    fetch(`${API_BASE_URL}/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing),
    }).then(res => res.json()),

  deleteListing: (id) =>
    fetch(`${API_BASE_URL}/listings/${id}`, { method: 'DELETE' }).then(res => res.json()),
};

// Booking API calls
export const bookingsAPI = {
  createBooking: (booking, tenantId, listingId) =>
    fetch(`${API_BASE_URL}/bookings?tenantId=${tenantId}&listingId=${listingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    }).then(res => res.json()),

  getBookingById: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}`).then(res => res.json()),

  getAllBookings: () =>
    fetch(`${API_BASE_URL}/bookings`).then(res => res.json()),

  getBookingsByTenant: (tenantId) =>
    fetch(`${API_BASE_URL}/bookings/tenant/${tenantId}`).then(res => res.json()),

  getBookingsByListing: (listingId) =>
    fetch(`${API_BASE_URL}/bookings/listing/${listingId}`).then(res => res.json()),

  updateBookingStatus: (id, status) =>
    fetch(`${API_BASE_URL}/bookings/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json()),

  updateBooking: (id, booking) =>
    fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    }).then(res => res.json()),

  deleteBooking: (id) =>
    fetch(`${API_BASE_URL}/bookings/${id}`, { method: 'DELETE' }).then(res => res.json()),
};
