import { useState, useEffect } from 'react';
import { Users, FileText, Calendar, Stethoscope, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/doctor/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Patients', value: stats?.total_patients ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Prescriptions', value: stats?.total_prescriptions ?? 0, icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'This Week', value: stats?.prescriptions_this_week ?? 0, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Consultations', value: stats?.total_consultations ?? 8, icon: Stethoscope, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const quickActions = [
    { label: 'My Patients', desc: 'View and manage your patient list', icon: Users, path: '/doctor/patients', color: 'text-blue-500' },
    { label: 'Prescriptions', desc: 'Create and manage prescriptions', icon: FileText, path: '/doctor/prescriptions', color: 'text-green-500' },
    { label: 'Appointments', desc: 'View your appointment schedule', icon: Calendar, path: '/doctor/appointments', color: 'text-purple-500' },
    { label: 'Consultations', desc: 'Active and upcoming consultations', icon: Stethoscope, path: '/doctor/consultations', color: 'text-orange-500' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#101922]">
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#111418] border-b border-gray-200 dark:border-[#283039] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-xs text-gray-500 dark:text-[#9dabb9]">Welcome back, {user?.name || 'Doctor'}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-[#9dabb9] font-medium">{stat.title}</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 dark:bg-[#283039] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl p-5 hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md dark:hover:shadow-primary/5 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <action.icon className={`w-6 h-6 ${action.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-sm">{action.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-[#9dabb9] mt-0.5 truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
