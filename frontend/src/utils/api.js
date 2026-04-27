import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

<<<<<<< Updated upstream
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const userAPI = {
    login: async (email, password) => {
        try {
            const response = await api.post('/users/login', { email, password });
            if (response.data.token) {
                sessionStorage.setItem('token', response.data.token);
            }
            return {
                success: true,
                user: response.data.user
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    },

    register: async (userData) => {
        try {
            const response = await api.post('/users/register', userData);
            return {
                success: true,
                user: response.data.user
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    },

    getUserById: async (id) => {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            return null;
        }
    },
};

// ✅ ADD THIS - Listings API
export const listingsAPI = {
    getAllListings: async () => {
        try {
            console.log('🔄 API: Fetching all listings...');
            const response = await api.get('/listings');
            console.log('📦 Listings response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ API: getAllListings error:', error);
            return [];
        }
    },

    getListingById: async (id) => {
        try {
            const response = await api.get(`/listings/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ API: getListingById error:', error);
            return null;
        }
    },

    getListingsByLandlord: async (landlordId) => {
        try {
            const response = await api.get(`/listings/landlord/${landlordId}`);
            return response.data;
        } catch (error) {
            console.error('❌ API: getListingsByLandlord error:', error);
            return [];
        }
    },

    createListing: async (listingData) => {
        try {
            const response = await api.post('/listings', listingData);
            return response.data;
        } catch (error) {
            console.error('❌ API: createListing error:', error);
            return null;
        }
    },

    updateListing: async (id, listingData) => {
        try {
            const response = await api.put(`/listings/${id}`, listingData);
            return response.data;
        } catch (error) {
            console.error('❌ API: updateListing error:', error);
            return null;
        }
    },

    deleteListing: async (id) => {
        try {
            await api.delete(`/listings/${id}`);
            return true;
        } catch (error) {
            console.error('❌ API: deleteListing error:', error);
            return false;
        }
    },
};

export const bookingsAPI = {
    getBookingsByTenant: async (tenantId) => {
        try {
            const response = await api.get(`/bookings/tenant/${tenantId}`);
            return response.data;
        } catch (error) {
            console.error('❌ API: getBookingsByTenant error:', error);
            return [];
        }
    },

    getBookingsByListing: async (listingId) => {
        try {
            const response = await api.get(`/bookings/listing/${listingId}`);
            return response.data;
        } catch (error) {
            console.error('❌ API: getBookingsByListing error:', error);
            return [];
        }
    },

    createBooking: async (bookingData) => {
        try {
            const response = await api.post('/bookings', bookingData);
            return response.data;
        } catch (error) {
            console.error('❌ API: createBooking error:', error);
            return null;
        }
    },

    updateBookingStatus: async (id, status) => {
        try {
            const response = await api.put(`/bookings/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('❌ API: updateBookingStatus error:', error);
            return null;
        }
    },
=======
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    if (value.includes('data:image/')) {
      const recovered = value.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g);
      if (Array.isArray(recovered) && recovered.length > 0) return recovered;
    }
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeListing(listing) {
  if (!listing || typeof listing !== 'object') return listing;
  return {
    ...listing,
    lat: listing.lat ?? listing.latitude ?? null,
    lng: listing.lng ?? listing.longitude ?? null,
    tags: toArray(listing.tags),
    images: toArray(listing.images),
  };
}

function normalizeData(path, payload) {
  if (!payload) return payload;

  if (path.startsWith('/listings')) {
    if (Array.isArray(payload)) return payload.map(normalizeListing);
    if (payload.listing) return { ...payload, listing: normalizeListing(payload.listing) };
    return normalizeListing(payload);
  }

  if (path.startsWith('/bookings')) {
    if (Array.isArray(payload)) {
      return payload.map((b) => ({ ...b, listing: normalizeListing(b.listing) }));
    }
    if (payload.booking) {
      return {
        ...payload,
        booking: { ...payload.booking, listing: normalizeListing(payload.booking.listing) },
      };
    }
  }

  return payload;
}

async function request(path, options = {}, config = {}) {
  const { unwrap = false } = config;

  const method = (options.method || 'GET').toLowerCase();
  const body = options.body ? JSON.parse(options.body) : undefined;

  let status = 0;
  let payload = null;
  let ok = false;

  try {
    const response = await apiClient.request({
      url: path,
      method,
      data: body,
      headers: options.headers || {},
    });
    status = response.status;
    payload = response.data;
    ok = true;
  } catch (error) {
    if (error.response) {
      status = error.response.status;
      payload = error.response.data;
      ok = false;
    } else {
      status = 0;
      payload = { message: 'Network error' };
      ok = false;
    }
  }

  payload = normalizeData(path, payload);

  if (unwrap) return payload;

  const result = {
    ok,
    status,
    data: payload,
  };

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    Object.assign(result, payload);
  }

  return result;
}

export const userAPI = {
  register: (userData) =>
    request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, { unwrap: true }),

  login: (email, password) =>
    request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, { unwrap: true }),

  getById: (id) => request(`/users/${id}`),
  getByEmail: (email) => request(`/users/email/${email}`),
  getAll: () => request('/users'),
  update: (id, userData) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  reviewVerification: (id, status, decision) =>
    request(`/users/${id}/verification?status=${encodeURIComponent(status)}${decision ? `&decision=${encodeURIComponent(decision)}` : ''}`, {
      method: 'PUT',
    }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  getUserById(id) { return this.getById(id); },
  getUserByEmail(email) { return this.getByEmail(email); },
  getAllUsers() { return this.getAll(); },
  updateUser(id, userData) { return this.update(id, userData); },
  deleteUser(id) { return this.delete(id); },
};

export const listingsAPI = {
  create: (listing, landlordId) =>
    request(`/listings?landlordId=${landlordId}`, {
      method: 'POST',
      body: JSON.stringify(listing),
    }),

  getById: (id) => request(`/listings/${id}`),
  getAll: () => request('/listings'),
  getActive: () => request('/listings/active'),
  getByLandlord: (landlordId) => request(`/listings/landlord/${landlordId}`),
  update: (id, listing) => request(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(listing) }),
  delete: (id) => request(`/listings/${id}`, { method: 'DELETE' }),

  createListing(listing, landlordId) { return this.create(listing, landlordId); },
  getListingById(id) { return this.getById(id); },
  getAllListings() { return this.getAll(); },
  getActiveListings() { return this.getActive(); },
  getListingsByLandlord(landlordId) { return this.getByLandlord(landlordId); },
  updateListing(id, listing) { return this.update(id, listing); },
  deleteListing(id) { return this.delete(id); },
};

export const bookingsAPI = {
  create: (booking, tenantId, listingId) =>
    request(`/bookings?tenantId=${tenantId}&listingId=${listingId}`, {
      method: 'POST',
      body: JSON.stringify(booking),
    }),

  getById: (id) => request(`/bookings/${id}`),
  getAll: () => request('/bookings'),
  getByTenant: (tenantId) => request(`/bookings/tenant/${tenantId}`),
  getByListing: (listingId) => request(`/bookings/listing/${listingId}`),
  updateStatus: (id, status) => request(`/bookings/${id}/status?status=${status}`, { method: 'PUT' }),
  update: (id, booking) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(booking) }),
  delete: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),

  createBooking(booking, tenantId, listingId) { return this.create(booking, tenantId, listingId); },
  getBookingById(id) { return this.getById(id); },
  getAllBookings() { return this.getAll(); },
  getBookingsByTenant(tenantId) { return this.getByTenant(tenantId); },
  getBookingsByListing(listingId) { return this.getByListing(listingId); },
  updateBookingStatus(id, status) { return this.updateStatus(id, status); },
  updateBooking(id, booking) { return this.update(id, booking); },
  deleteBooking(id) { return this.delete(id); },
};

export const reviewsAPI = {
  create: (review, tenantId, listingId) =>
    request(`/reviews?tenantId=${tenantId}&listingId=${listingId}`, {
      method: 'POST',
      body: JSON.stringify(review),
    }),
  getAll: () => request('/reviews'),
  getByListing: (listingId) => request(`/reviews/listing/${listingId}`),
  delete: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
};

export const bookmarksAPI = {
  create: (tenantId, listingId) =>
    request(`/bookmarks?tenantId=${tenantId}&listingId=${listingId}`, {
      method: 'POST',
    }),
  getAll: () => request('/bookmarks'),
  getByTenant: (tenantId) => request(`/bookmarks/tenant/${tenantId}`),
  delete: (tenantId, listingId) =>
    request(`/bookmarks?tenantId=${tenantId}&listingId=${listingId}`, { method: 'DELETE' }),
  deleteById: (id) => request(`/bookmarks/${id}`, { method: 'DELETE' }),
};

export const reportsAPI = {
  file: (report, reporterId) =>
    request(`/reports?reporterId=${reporterId}`, {
      method: 'POST',
      body: JSON.stringify(report),
    }),
  getAll: () => request('/reports'),
  getByStatus: (status) => request(`/reports/status/${status}`),
  updateStatus: (id, status) => request(`/reports/${id}/status?status=${status}`, { method: 'PUT' }),
  delete: (id) => request(`/reports/${id}`, { method: 'DELETE' }),
};

export const messagesAPI = {
  send: (message, senderId, receiverId) =>
    request(`/messages?senderId=${senderId}&receiverId=${receiverId}`, {
      method: 'POST',
      body: JSON.stringify(message),
    }),
  getAll: () => request('/messages'),
  getByConversation: (conversationId) => request(`/messages/conversation/${conversationId}`),
  delete: (id) => request(`/messages/${id}`, { method: 'DELETE' }),
};

export const supportMessagesAPI = {
  create: (payload, userId) =>
    request(`/support-messages${userId ? `?userId=${userId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAll: () => request('/support-messages'),
  getByStatus: (status) => request(`/support-messages/status/${status}`),
  updateStatus: (id, status) => request(`/support-messages/${id}/status?status=${status}`, { method: 'PUT' }),
  delete: (id) => request(`/support-messages/${id}`, { method: 'DELETE' }),
>>>>>>> Stashed changes
};

export default api;