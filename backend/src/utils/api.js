const API_BASE = 'http://localhost:8080/api';

// ─── Helper: Make API calls ───────────────────────────────
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Don't set body for GET/DELETE requests
  if (!config.body && (options.method === 'POST' || options.method === 'PUT')) {
    delete config.body;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════

export const authAPI = {
  register: async (userData) => {
    // userData: { email, password, firstName, lastName, phone, userType }
    return fetchAPI('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (email, password) => {
    // LoginRequest: { email, password }
    return fetchAPI('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getUserById: async (id) => {
    return fetchAPI(`/users/${id}`);
  },

  getUserByEmail: async (email) => {
    return fetchAPI(`/users/email/${email}`);
  },

  updateUser: async (id, updates) => {
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteUser: async (id) => {
    return fetchAPI(`/users/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════
// LISTINGS API
// ═══════════════════════════════════════════════════════════

export const listingsAPI = {
  // Get all listings
  getAll: async () => {
    return fetchAPI('/listings');
  },

  // Get active listings only
  getActive: async () => {
    return fetchAPI('/listings/active');
  },

  // Get single listing by ID
  getById: async (id) => {
    return fetchAPI(`/listings/${id}`);
  },

  // Get listings by landlord
  getByLandlord: async (landlordId) => {
    return fetchAPI(`/listings/landlord/${landlordId}`);
  },

  // Create listing (requires landlordId as query param)
  create: async (listingData, landlordId) => {
    return fetchAPI(`/listings?landlordId=${landlordId}`, {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  },

  // Update listing
  update: async (id, updates) => {
    return fetchAPI(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete listing
  delete: async (id) => {
    return fetchAPI(`/listings/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════
// BOOKINGS API
// ═══════════════════════════════════════════════════════════

export const bookingsAPI = {
  // Get all bookings
  getAll: async () => {
    return fetchAPI('/bookings');
  },

  // Get booking by ID
  getById: async (id) => {
    return fetchAPI(`/bookings/${id}`);
  },

  // Get bookings by tenant
  getByTenant: async (tenantId) => {
    return fetchAPI(`/bookings/tenant/${tenantId}`);
  },

  // Get bookings by listing (for landlord)
  getByListing: async (listingId) => {
    return fetchAPI(`/bookings/listing/${listingId}`);
  },

  // Create booking (requires tenantId & listingId)
  create: async (bookingData, tenantId, listingId) => {
    return fetchAPI(`/bookings?tenantId=${tenantId}&listingId=${listingId}`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Update booking status: 'pending', 'accepted', 'rejected'
  updateStatus: async (id, status) => {
    return fetchAPI(`/bookings/${id}/status?status=${status}`, {
      method: 'PUT',
    });
  },

  // Update booking (full update)
  update: async (id, updates) => {
    return fetchAPI(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete booking
  delete: async (id) => {
    return fetchAPI(`/bookings/${id}`, { method: 'DELETE' });
  },
};

export default { authAPI, listingsAPI, bookingsAPI };