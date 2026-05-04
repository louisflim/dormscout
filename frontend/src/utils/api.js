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

    updateUser: async (id, userData) => {
        try {
            const response = await api.put(`/users/${id}`, userData);
            return response.data;
        } catch (error) {
            console.error('❌ API: updateUser error:', error);
            return null;
        }
    },

    deleteUser: async (id) => {
        try {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ API: deleteUser error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete account',
            };
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

    // Backward-compatible alias used in some contexts/components
    getById: async (id) => {
        const data = await listingsAPI.getListingById(id);
        return { data };
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

    // Backward-compatible alias used in some contexts/components
    update: async (id, listingData) => {
        const data = await listingsAPI.updateListing(id, listingData);
        return { ok: Boolean(data?.success), data };
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
    getAll: async () => {
        try {
            const response = await api.get('/bookings');
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('❌ API: getAllBookings error:', error);
            return [];
        }
    },

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
            return {
                success: false,
                message: error.response?.data?.message || 'Booking creation failed'
            };
        }
    },

    // Backward-compatible alias used in BookingContext
    create: async (bookingData, tenantId, listingId) => {
        try {
            const payload = {
                ...bookingData,
                checkInDate: bookingData.checkInDate || bookingData.moveInDate,
                tenantId,
                listingId,
            };
            const data = await bookingsAPI.createBooking(payload);
            return { ok: Boolean(data?.success), data };
        } catch (error) {
            console.error('❌ API: create alias error:', error);
            return { ok: false, data: { success: false, message: 'Booking failed' } };
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

    // Backward-compatible alias used in BookingContext
    updateStatus: async (id, status) => {
        try {
            const data = await bookingsAPI.updateBookingStatus(id, status);
            return { ok: Boolean(data?.success), data };
        } catch (error) {
            console.error('❌ API: updateStatus alias error:', error);
            return { ok: false, data: { success: false, message: 'Failed to update booking status' } };
        }
    },

    deleteBooking: async (id) => {
        try {
            const response = await api.delete(`/bookings/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ API: deleteBooking error:', error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete booking' };
        }
    },

    // Backward-compatible alias used in BookingContext/BookingPage
    delete: async (id) => {
        const data = await bookingsAPI.deleteBooking(id);
        return { ok: Boolean(data?.success), success: Boolean(data?.success), data, message: data?.message };
    },
};

export const activitiesAPI = {
    getActivitiesByUser: (userId) => api.get(`/activities/user/${userId}`),
    createActivity: (userId, type, text, time, nav) =>
        api.post(`/activities?userId=${userId}&type=${type}&text=${encodeURIComponent(text)}&time=${time || ''}&nav=${nav || ''}`),
    markAsRead: (id) => api.put(`/activities/${id}/read`),
    deleteActivity: (id) => api.delete(`/activities/${id}`),
};

// ── Messages / Conversations ─────────────────────────────────────────────────
export const messagesAPI = {
    /**
     * Send a message.
     * @param {number} senderId
     * @param {number} receiverId
     * @param {string} content
     * @param {string} conversationId - deterministic: "conv_<minId>_<maxId>"
     */
    sendMessage: async (senderId, receiverId, content, conversationId) => {
        try {
            const response = await api.post(
                '/messages',
                { content, conversationId },
                { params: { senderId, receiverId } }
            );
            return response.data;
        } catch (error) {
            console.error('❌ API: sendMessage error:', error);
            return null;
        }
    },

    /** Get conversation summary list for a user (sidebar data) */
    getConversations: async (userId) => {
        try {
            const response = await api.get(`/messages/conversations/${userId}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('❌ API: getConversations error:', error);
            return [];
        }
    },

    /** Get all messages for a conversation (by conversationId string) */
    getConversationMessages: async (conversationId) => {
        try {
            const response = await api.get(`/messages/conversation/${conversationId}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('❌ API: getConversationMessages error:', error);
            return [];
        }
    },

    /** Mark all unread messages in a conversation as read for this user */
    markConversationRead: async (conversationId, readerId) => {
        try {
            await api.put(`/messages/conversation/${conversationId}/read`, {}, { params: { readerId } });
        } catch (error) {
            console.error('❌ API: markConversationRead error:', error);
        }
    },

    /** Delete a single message by id */
    deleteMessage: async (id) => {
        try {
            await api.delete(`/messages/${id}`);
            return true;
        } catch (error) {
            console.error('❌ API: deleteMessage error:', error);
            return false;
        }
    },

    /** Delete all messages in a conversation for the calling user */
    deleteConversation: async (conversationId, userId) => {
        try {
            await api.delete(`/messages/conversation/${conversationId}`, { params: { userId } });
            return true;
        } catch (error) {
            console.error('❌ API: deleteConversation error:', error);
            return false;
        }
    },
};

export const bookmarksAPI = {
    /** Save a bookmark for a tenant */
    addBookmark: async (tenantId, listingId) => {
        try {
            const response = await api.post('/bookmarks', {}, { params: { tenantId, listingId } });
            return response.data;
        } catch (error) {
            console.error('❌ API: addBookmark error:', error);
            return null;
        }
    },

    /** Get all bookmarks for a tenant */
    getBookmarks: async (tenantId) => {
        try {
            const response = await api.get(`/bookmarks/tenant/${tenantId}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('❌ API: getBookmarks error:', error);
            return [];
        }
    },

    /** Remove a bookmark */
    removeBookmark: async (tenantId, listingId) => {
        try {
            await api.delete('/bookmarks', { params: { tenantId, listingId } });
            return true;
        } catch (error) {
            console.error('❌ API: removeBookmark error:', error);
            return false;
        }
    },

    /** Check if a listing is already bookmarked by tenant */
    isBookmarked: async (tenantId, listingId) => {
        try {
            const bookmarks = await bookmarksAPI.getBookmarks(tenantId);
            return bookmarks.some(b => b.listingId === listingId);
        } catch {
            return false;
        }
    },
};

export const reviewsAPI = {
    /** Get reviews for a listing */
    getByListing: async (listingId) => {
        try {
            const response = await api.get(`/reviews/listing/${listingId}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('❌ API: getReviewsByListing error:', error);
            return [];
        }
    },

    /** Submit a review */
    createReview: async (tenantId, listingId, reviewData) => {
        try {
            const response = await api.post('/reviews', reviewData, { params: { tenantId, listingId } });
            return response.data;
        } catch (error) {
            console.error('❌ API: createReview error:', error);
            return null;
        }
    },

    /** Delete a review */
    deleteReview: async (id) => {
        try {
            await api.delete(`/reviews/${id}`);
            return true;
        } catch (error) {
            console.error('❌ API: deleteReview error:', error);
            return false;
        }
    },
};

export const reportsAPI = {
    /** File a report */
    fileReport: async (reporterId, reportData) => {
        try {
            const response = await api.post('/reports', reportData, { params: { reporterId } });
            return response.data;
        } catch (error) {
            console.error('❌ API: fileReport error:', error);
            return null;
        }
    },
};

export default api;