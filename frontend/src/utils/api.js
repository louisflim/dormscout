import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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

export const listingsAPI = {
    getAllListings: async () => {
        try {
            const response = await api.get('/listings');
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

    createListing: async (listingData, landlordId) => {
            try {
                const response = await api.post('/listings', listingData, {
                    params: { landlordId }
                });
                return response.data;  // Clean JSON - no parsing needed now
            } catch (error) {
                console.error('❌ API: createListing error:', error);
                let errorMessage = error.message;
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                return {
                    success: false,
                    message: errorMessage
                };
            }
        },

    updateListing: async (id, listingData) => {
        try {
            const response = await api.put(`/listings/${id}`, listingData);
            return response.data;
        } catch (error) {
            console.error('❌ API: updateListing error:', error);
            return { success: false, message: error.message };
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
            const response = await api.post('/bookings', bookingData, {
                params: {
                    tenantId: bookingData.tenantId,
                    listingId: bookingData.listingId
                }
            });
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
};

export const activitiesAPI = {
    getActivitiesByUser: (userId) => api.get(`/activities/user/${userId}`),
    createActivity: (userId, type, text, time, nav) =>
        api.post(`/activities?userId=${userId}&type=${type}&text=${encodeURIComponent(text)}&time=${time || ''}&nav=${nav || ''}`),
    markAsRead: (id) => api.put(`/activities/${id}/read`),
    deleteActivity: (id) => api.delete(`/activities/${id}`),
};

export default api;