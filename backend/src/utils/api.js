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
    register: async (userData) => {
        try {
            console.log('🔄 API: Sending register request to /users/register...');
            console.log('📦 Request data:', userData);

            const response = await api.post('/users/register', userData);

            console.log('✅ API: Register response received');
            console.log('📦 Full response data:', response.data);
            console.log('📦 user in response:', response.data.user);
            console.log('📦 userType in response:', response.data.user?.userType);

            return {
                success: true,
                user: response.data.user
            };
        } catch (error) {
            console.error('❌ API: Register error:', error);
            console.error('❌ API: Error response:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    },

    login: async (email, password) => {
        try {
            console.log('🔄 API: Sending login request to /users/login...');
            console.log('📧 Email:', email);

            const response = await api.post('/users/login', { email, password });

            console.log('✅ API: Login response received');
            console.log('📦 Full response data:', response.data);
            console.log('📦 user in response:', response.data.user);
            console.log('📦 userType in response:', response.data.user?.userType);

            return {
                success: true,
                user: response.data.user
            };
        } catch (error) {
            console.error('❌ API: Login error:', error);
            console.error('❌ API: Error response:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    },

    getUserById: async (id) => {
        try {
            console.log('🔄 API: Fetching user by ID:', id);
            const response = await api.get(`/users/${id}`);
            console.log('📦 getUserById response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ API: getUserById error:', error);
            return null;
        }
    },

    // ✅ CORRECT: /users/{id}
    updateUser: async (id, userData) => {
        try {
            const response = await api.put(`/users/${id}`, userData);
            return response.data;
        } catch (error) {
            console.error('❌ API: updateUser error:', error);
            return null;
        }
    },
};

export default api;