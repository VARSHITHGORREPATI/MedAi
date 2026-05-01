import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Heart, History, Settings, Cross, MessageSquare,
  Pill, TestTubes, FileText, Users, Calendar, Stethoscope,
  BarChart, Shield, UserPlus, Sun, Moon, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PATIENT_NAV_ITEMS = [
  { path: '/chatbot', icon: MessageSquare, label: 'AI Chatbot' },
  { path: '/nearby-doctors', icon: MapPin, label: 'Nearby Doctors' },
  { path: '/health-tracking', icon: Heart, label: 'Health Tracking' },
  { path: '/medicines', icon: Pill, label: 'Medicine Reminders' },
  { path: '/pharmacy', icon: Pill, label: 'Pharmacy' },
  { path: '/lab-tests', icon: TestTubes, label: 'Lab Tests' },
  { path: '/prescriptions', icon: FileText, label: 'My Prescriptions' },
  { path: '/profile', icon: Settings, label: 'Profile' },
];

const DOCTOR_NAV_ITEMS = [
  { path: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/doctor/patients', icon: Users, label: 'My Patients' },
  { path: '/doctor/consultations', icon: Stethoscope, label: 'Consultations' },
  { path: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
  { path: '/doctor/prescriptions', icon: FileText, label: 'Prescriptions' },
  { path: '/doctor/settings', icon: Settings, label: 'Settings' },
];

const ADMIN_NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'User Management' },
  { path: '/admin/create-doctor', icon: UserPlus, label: 'Create Doctor' },
  { path: '/admin/roles', icon: Shield, label: 'Roles & Permissions' },
  { path: '/admin/analytics', icon: BarChart, label: 'Analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const goToProfile = () => {
    if (user?.role === 'doctor') navigate('/doctor/profile');
    else if (user?.role === 'admin') navigate('/admin/settings');
    else navigate('/profile');
  };

  const getNavItems = () => {
    if (user?.role === 'admin') return ADMIN_NAV_ITEMS;
    if (user?.role === 'doctor') return DOCTOR_NAV_ITEMS;
    return PATIENT_NAV_ITEMS;
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-full bg-white dark:bg-[#111418] border-r border-gray-200 dark:border-[#283039] p-4 justify-between shrink-0 z-20">
      <div className="flex flex-col gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white">
            <Cross className="w-5 h-5" />
          </div>
          <h1 className="text-gray-900 dark:text-white text-xl font-bold leading-normal tracking-tight">MedAI</h1>
        </div>

        {/* Role Badge */}
        {user?.role && (
          <div className="px-3 py-2 bg-gray-100 dark:bg-[#283039] rounded-lg">
            <p className="text-xs text-gray-600 dark:text-[#9dabb9] uppercase tracking-wide">{user.role}</p>
          </div>
        )}

        {/* Nav Menu */}
        <nav className="flex flex-col gap-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-[#9dabb9] hover:bg-gray-50 dark:hover:bg-[#283039] hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <p className={`text-sm font-medium leading-normal`}>{item.label}</p>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom: Theme Toggle + User Profile */}
      <div className="flex flex-col gap-1 border-t border-gray-200 dark:border-[#283039] pt-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 dark:text-[#9dabb9] hover:bg-gray-50 dark:hover:bg-[#283039] hover:text-gray-900 dark:hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">Dark Mode</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#283039] cursor-pointer transition-colors" onClick={goToProfile}>
          <div
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#283039] bg-cover bg-center"
            style={{ backgroundImage: user?.picture ? `url('${user.picture}')` : 'none' }}
          >
            {!user?.picture && (
              <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-gray-900 dark:text-white text-sm font-bold leading-normal">{user?.name || 'User'}</p>
            <p className="text-gray-600 dark:text-[#9dabb9] text-xs font-normal">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
