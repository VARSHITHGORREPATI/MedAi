import { useState, useEffect } from 'react';
import { Users, Activity, FileText, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: `+${stats?.new_users_this_week || 0} this week`
    },
    {
      title: 'Patients',
      value: stats?.total_patients || 0,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Doctors',
      value: stats?.total_doctors || 0,
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      title: 'Products',
      value: stats?.total_products || 0,
      icon: ShoppingCart,
      color: 'bg-orange-500'
    },
    {
      title: 'Lab Bookings',
      value: stats?.total_bookings || 0,
      icon: TrendingUp,
      color: 'bg-pink-500',
      change: `+${stats?.new_bookings_this_week || 0} this week`
    },
    {
      title: 'Prescriptions',
      value: stats?.total_prescriptions || 0,
      icon: FileText,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  {stat.change && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">{stat.change}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
          >
            <Users className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Users</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and manage all users</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
          >
            <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View detailed analytics</p>
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
          >
            <AlertCircle className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure platform settings</p>
          </button>
        </div>
      </div>
    </div>
  );
}
