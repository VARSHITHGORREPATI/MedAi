import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/DashboardLayout';

// Eager load only auth pages (first visited)
import Login from './pages/Login';
import Register from './pages/Register';
import AuthSuccess from './pages/AuthSuccess';

// Lazy load all other pages
const Profile = lazy(() => import('./pages/Profile'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const HealthTracking = lazy(() => import('./pages/HealthTracking'));
const MedicineReminder = lazy(() => import('./pages/MedicineReminder'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));
const LabTests = lazy(() => import('./pages/LabTests'));
const PatientPrescriptions = lazy(() => import('./pages/PatientPrescriptions'));
const NearbyDoctors = lazy(() => import('./pages/NearbyDoctors'));
const Orders = lazy(() => import('./pages/Orders'));
const MyLabTests = lazy(() => import('./pages/MyLabTests'));
const Consultations = lazy(() => import('./pages/Consultations'));
const ScanMedicines = lazy(() => import('./pages/ScanMedicines'));
const Help = lazy(() => import('./pages/Help'));
const About = lazy(() => import('./pages/About'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AdminRoles = lazy(() => import('./pages/AdminRoles'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const CreateDoctor = lazy(() => import('./pages/CreateDoctor'));

// Doctor Pages
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const DoctorProfile = lazy(() => import('./pages/DoctorProfile'));
const PatientList = lazy(() => import('./pages/PatientList'));
const DoctorConsultations = lazy(() => import('./pages/DoctorConsultations'));
const DoctorAppointments = lazy(() => import('./pages/DoctorAppointments'));
const DoctorPrescriptions = lazy(() => import('./pages/DoctorPrescriptions'));
const DoctorSettings = lazy(() => import('./pages/DoctorSettings'));

// Loading component
const PageLoader = () => (
    <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
        </div>
    </div>
);

function ProtectedRoute({ children, useMainLayout = true, allowedRoles = [] }) {
    const { isAuthenticated, loading, user } = useAuth();
    
    if (loading) {
        return <PageLoader />;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        const roleRedirect = {
            'admin': '/admin/dashboard',
            'doctor': '/doctor/dashboard',
            'patient': '/chatbot'
        };
        return <Navigate to={roleRedirect[user?.role] || '/chatbot'} replace />;
    }
    
    return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function DashboardRouter() {
    const { user } = useAuth();

    if (user?.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'doctor') {
        return <Navigate to="/doctor/dashboard" replace />;
    } else {
        return <Navigate to="/chatbot" replace />;
    }
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/success" element={<AuthSuccess />} />

                {/* Patient Routes */}
                <Route path="/chatbot" element={<ProtectedRoute useMainLayout={false}><Chatbot /></ProtectedRoute>} />
                <Route path="/health-tracking" element={<ProtectedRoute useMainLayout={false}><HealthTracking /></ProtectedRoute>} />
                <Route path="/medicines" element={<ProtectedRoute useMainLayout={false}><MedicineReminder /></ProtectedRoute>} />

                <Route path="/pharmacy" element={<ProtectedRoute useMainLayout={false}><Pharmacy /></ProtectedRoute>} />
                <Route path="/lab-tests" element={<ProtectedRoute useMainLayout={false}><LabTests /></ProtectedRoute>} />
                <Route path="/prescriptions" element={<ProtectedRoute useMainLayout={false}><PatientPrescriptions /></ProtectedRoute>} />
                <Route path="/nearby-doctors" element={<ProtectedRoute useMainLayout={false}><NearbyDoctors /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute useMainLayout={false}><Profile /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute useMainLayout={false}><Orders /></ProtectedRoute>} />
                <Route path="/my-lab-tests" element={<ProtectedRoute useMainLayout={false}><MyLabTests /></ProtectedRoute>} />
                <Route path="/consultations" element={<ProtectedRoute useMainLayout={false}><Consultations /></ProtectedRoute>} />
                <Route path="/scan-medicines" element={<ProtectedRoute useMainLayout={false}><ScanMedicines /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute useMainLayout={false}><Help /></ProtectedRoute>} />
                <Route path="/about" element={<ProtectedRoute useMainLayout={false}><About /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><UserManagement /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminRoles /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminAnalytics /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminSettings /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/create-doctor" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><CreateDoctor /></DashboardLayout></ProtectedRoute>} />

                {/* Doctor Routes */}
                <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DashboardLayout><DoctorDashboard /></DashboardLayout></ProtectedRoute>} />
                <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DashboardLayout><PatientList /></DashboardLayout></ProtectedRoute>} />
                <Route path="/doctor/consultations" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DashboardLayout><DoctorConsultations /></DashboardLayout></ProtectedRoute>} />
                <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DashboardLayout><DoctorAppointments /></DashboardLayout></ProtectedRoute>} />
                <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DashboardLayout><DoctorPrescriptions /></DashboardLayout></ProtectedRoute>} />
                <Route path="/doctor/settings" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DashboardLayout><DoctorSettings /></DashboardLayout></ProtectedRoute>} />
                <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DashboardLayout><DoctorProfile /></DashboardLayout></ProtectedRoute>} />

                {/* Default Routes */}
                <Route path="/" element={isAuthenticated ? <ProtectedRoute useMainLayout={false}><DashboardRouter /></ProtectedRoute> : <Navigate to="/login" replace />} />
                <Route path="*" element={isAuthenticated ? <ProtectedRoute useMainLayout={false}><DashboardRouter /></ProtectedRoute> : <Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

function App() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <ThemeProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
