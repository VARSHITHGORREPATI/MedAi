import axios from 'axios';

// API Base URL - Update this to your backend URL when deployed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if it's not a login/register request
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register') ||
                           error.config?.url?.includes('/auth/google') ||
                           error.config?.url?.includes('/auth/verify-otp');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expired or invalid (not a login failure)
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Login with email/password
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  // Login with OTP
  requestOTP: async (mobile) => {
    const response = await api.post('/api/auth/request-otp', { mobile });
    return response.data;
  },

  verifyOTP: async (mobile, otp) => {
    const response = await api.post('/api/auth/verify-otp', { mobile, otp });
    return response.data;
  },

  // Google OAuth
  googleAuth: async (credential) => {
    const response = await api.post('/api/auth/google', { credential });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return response.data;
  },

  // Get health profile
  getHealthProfile: async () => {
    const response = await api.get('/api/auth/profile/health');
    return response.data;
  },

  // Update health profile
  updateHealthProfile: async (healthData) => {
    const response = await api.put('/api/auth/profile/health', healthData);
    return response.data;
  },
};

// Chat APIs
export const chatAPI = {
  // Get all chats for user
  getChats: async () => {
    const response = await api.get('/api/chat/sessions');
    return response.data;
  },

  // Get specific chat
  getChat: async (chatId) => {
    const response = await api.get(`/api/chat/sessions/${chatId}`);
    return response.data;
  },

  // Create new chat
  createChat: async () => {
    // In the new backend, chats are created automatically when sending the first message
    // Return a placeholder that signals no session_id yet
    return { session_id: null };
  },

  // Send message
  sendMessage: async (message, sessionId = null, useRag = false) => {
    const response = await api.post('/api/chat/', {
      message: message,
      session_id: sessionId,
      use_rag: useRag
    });
    return response.data;
  },

  // Generate health recommendations
  generateRecommendations: async (message) => {
    const response = await api.post('/api/chat/generate-recommendations', {
      message: message
    });
    return response.data;
  },

  // Get latest recommendations
  getLatestRecommendations: async () => {
    const response = await api.get('/api/chat/recommendations/latest');
    return response.data;
  },

  // Apply recommendations
  applyRecommendations: async (recommendationId) => {
    const response = await api.post(`/api/chat/recommendations/${recommendationId}/apply`);
    return response.data;
  },

  // Upload image/report
  uploadFile: async (chatId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/chat/${chatId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Analyze health issue
  analyzeIssue: async (chatId, data) => {
    const response = await api.post(`/api/chat/${chatId}/analyze`, data);
    return response.data;
  },
};

// Medicine Reminder APIs
export const medicineAPI = {
  // Get all medicine reminders
  getMedicines: async () => {
    const response = await api.get('/api/medicine/reminders');
    return response.data;
  },

  // Add medicine reminder
  addMedicine: async (medicineData) => {
    const response = await api.post('/api/medicine/reminders', medicineData);
    return response.data;
  },

  // Update medicine reminder
  updateMedicine: async (medicineId, medicineData) => {
    const response = await api.put(`/api/medicine/reminders/${medicineId}`, medicineData);
    return response.data;
  },

  // Delete medicine reminder
  deleteMedicine: async (medicineId) => {
    const response = await api.delete(`/api/medicine/reminders/${medicineId}`);
    return response.data;
  },

  // Log medicine intake
  logIntake: async (intakeData) => {
    const response = await api.post('/api/medicine/log', intakeData);
    return response.data;
  },
};

// Health Tracking APIs
export const healthAPI = {
  // Get health logs
  getHealthLogs: async (startDate, endDate) => {
    const response = await api.get('/api/health/logs', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Add health log
  addHealthLog: async (logData) => {
    const response = await api.post('/api/health/logs', logData);
    return response.data;
  },

  // Update health log
  updateHealthLog: async (logId, logData) => {
    const response = await api.put(`/api/health/logs/${logId}`, logData);
    return response.data;
  },

  // Get health trends
  getHealthTrends: async (metric, period) => {
    const response = await api.get('/api/health/analytics', {
      params: { metric, period },
    });
    return response.data;
  },

  // Get vitals summary
  getVitalsSummary: async () => {
    const response = await api.get('/api/health/analytics');
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  // Get admin dashboard stats
  getStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  // User management
  getAllUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/api/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Booking management
  getAllBookings: async (params = {}) => {
    const response = await api.get('/api/admin/bookings', { params });
    return response.data;
  },

  updateBookingStatus: async (bookingId, status) => {
    const response = await api.put(`/api/admin/bookings/${bookingId}/status`, { status });
    return response.data;
  },
};

// Doctor APIs (extended)
export const doctorDashboardAPI = {
  // Get doctor dashboard stats
  getStats: async () => {
    const response = await api.get('/api/doctor/stats');
    return response.data;
  },

  // Get doctor's patients
  getPatients: async (params = {}) => {
    const response = await api.get('/api/doctor/patients', { params });
    return response.data;
  },

  // Get patient details
  getPatientDetails: async (patientId) => {
    const response = await api.get(`/api/doctor/patients/${patientId}`);
    return response.data;
  },

  // Search doctors
  searchDoctors: async (params = {}) => {
    const response = await api.get('/api/doctor/search', { params });
    return response.data;
  },
};

// Prescription APIs (extended)
export const prescriptionDashboardAPI = {
  // Get all prescriptions (role-based)
  getPrescriptions: async (params = {}) => {
    const response = await api.get('/api/prescriptions', { params });
    return response.data;
  },

  // Get specific prescription
  getPrescription: async (prescriptionId) => {
    const response = await api.get(`/api/prescriptions/${prescriptionId}`);
    return response.data;
  },

  // Create prescription (doctor only)
  createPrescription: async (prescriptionData) => {
    const response = await api.post('/api/prescriptions', prescriptionData);
    return response.data;
  },

  // Update prescription status
  updatePrescriptionStatus: async (prescriptionId, status) => {
    const response = await api.put(`/api/prescriptions/${prescriptionId}/status`, { status });
    return response.data;
  },
};

// Analysis APIs
export const analysisAPI = {
  // Image analysis
  analyzeImage: async (imageFile, analysisType) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('analysis_type', analysisType);
    const response = await api.post('/api/analysis/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Symptom analysis
  analyzeSymptoms: async (symptoms) => {
    const response = await api.post('/api/analysis/symptoms', { symptoms });
    return response.data;
  },

  // Health trends
  getHealthTrendsAnalysis: async () => {
    const response = await api.get('/api/analysis/health-trends');
    return response.data;
  },
};

export default api;
