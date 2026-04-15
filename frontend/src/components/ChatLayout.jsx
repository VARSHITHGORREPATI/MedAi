import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Home, Bell, User, Menu, X, Cross, Pill, TestTubes, FileText, Heart, Sun, Moon, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PATIENT_NAV_ITEMS = [
  { path: '/chatbot', icon: Home, label: 'AI Chatbot' },
  { path: '/nearby-doctors', icon: MapPin, label: 'Nearby Doctors' },
  { path: '/health-tracking', icon: Heart, label: 'Health Tracking' },
  { path: '/medicines', icon: Bell, label: 'Medicine Reminders' },
  { path: '/pharmacy', icon: Pill, label: 'Pharmacy' },
  { path: '/lab-tests', icon: TestTubes, label: 'Lab Tests' },
  { path: '/prescriptions', icon: FileText, label: 'My Prescriptions' },
];

function ChatSidebar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-[280px] flex-shrink-0 flex-col border-r border-gray-200 dark:border-[#283039] bg-white dark:bg-[#111418] h-full hidden lg:flex">
      <div className="p-4 pb-2">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white shadow-lg">
            <Cross className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight">MedAI</h1>
            <p className="text-gray-600 dark:text-[#9dabb9] text-xs font-medium uppercase tracking-wider">Healthcare Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {PATIENT_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-[#9dabb9] hover:bg-gray-50 dark:hover:bg-[#283039] hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Theme Toggle + User Profile */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-[#283039] flex flex-col gap-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 dark:text-[#9dabb9] hover:bg-gray-50 dark:hover:bg-[#283039] hover:text-gray-900 dark:hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
          <User className="w-5 h-5 text-gray-600 dark:text-[#9dabb9]" />
          <div className="flex flex-col">
            <p className="text-gray-900 dark:text-white text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-gray-600 dark:text-[#9dabb9] text-xs">View Profile</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}

export default function ChatLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-[#101922] text-gray-900 dark:text-white font-display overflow-hidden h-screen w-full flex">
      {/* Desktop Sidebar */}
      <ChatSidebar />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#111418] border-b border-gray-200 dark:border-[#283039] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-white">
            <Cross className="w-4 h-4" />
          </div>
          <span className="text-gray-900 dark:text-white text-lg font-bold tracking-tight">MedAI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-[#283039] rounded-md"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-[280px] h-full" onClick={(e) => e.stopPropagation()}>
            <ChatSidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111418] relative pt-16 lg:pt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
