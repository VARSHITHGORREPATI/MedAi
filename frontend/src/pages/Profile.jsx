import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  FileText,
  Stethoscope,
  Activity,
  Scan,
  HelpCircle,
  Info,
  LogOut,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  Package,
  TestTube,
  Heart,
  Camera,
  Ruler,
  Weight,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatLayout from '../components/ChatLayout';

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [stats, setStats] = useState({ orders: 0, labTests: 0, consultations: 0, healthScore: '-' });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || user?.profile_picture || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
    setAvatarUploading(true);
    try {
      // Convert to base64 and save via profile update
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result;
        setAvatarUrl(dataUrl);
        try {
          const token = localStorage.getItem('authToken');
          const res = await fetch('http://localhost:8000/api/auth/profile', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_picture: dataUrl }),
          });
          if (res.ok) {
            const data = await res.json();
            if (setUser) setUser(prev => ({ ...prev, avatar_url: dataUrl, profile_picture: dataUrl }));
          }
        } catch {}
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { setAvatarUploading(false); }
  };
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    location: user?.location || '',
    date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    height: user?.height || '',
    weight: user?.weight || ''
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch('http://localhost:8000/api/orders/', { headers }).then(r => r.ok ? r.json() : null),
      fetch('http://localhost:8000/api/lab-tests/bookings', { headers }).then(r => r.ok ? r.json() : null),
      fetch('http://localhost:8000/api/health/logs', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([ordersData, labData, healthData]) => {
      const ordersCount = ordersData?.data?.length ?? ordersData?.orders?.length ?? 0;
      const labCount = labData?.data?.length ?? 0;
      let healthScore = '-';
      const logs = Array.isArray(healthData) ? healthData : (healthData?.data || []);
      const latestLog = logs[0];
      if (latestLog?.vital_signs) {
        const vs = latestLog.vital_signs;
        let score = 100;
        if (vs.blood_pressure_systolic > 140) score -= 20;
        else if (vs.blood_pressure_systolic > 130) score -= 10;
        if (vs.blood_sugar > 180) score -= 20;
        else if (vs.blood_sugar > 130) score -= 10;
        if (vs.heart_rate > 100 || vs.heart_rate < 50) score -= 10;
        healthScore = Math.max(score, 40);
      }
      setStats({ orders: ordersCount, labTests: labCount, consultations: 4, healthScore });
    }).catch(() => {});
  }, []);

  const handleEditClick = () => {
    setFormData({
      name: user?.name || '',
      mobile: user?.mobile || '',
      location: user?.location || '',
      date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
      gender: user?.gender || '',
      height: user?.height || '',
      weight: user?.weight || ''
    });
    setShowEditModal(true);
    setEditError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        setEditError(errorData.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      setEditError('Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'orders',
      icon: ShoppingBag,
      label: 'My Orders',
      description: 'Track your medicine orders',
      onClick: () => navigate('/orders'),
      color: 'text-blue-600'
    },
    {
      id: 'lab-tests',
      icon: TestTube,
      label: 'My Lab Tests',
      description: 'View test bookings & reports',
      onClick: () => navigate('/my-lab-tests'),
      color: 'text-purple-600'
    },
    {
      id: 'consultations',
      icon: Stethoscope,
      label: 'My Consultations',
      description: 'Past & upcoming consultations',
      onClick: () => navigate('/consultations'),
      color: 'text-green-600'
    },
    {
      id: 'health-records',
      icon: Activity,
      label: 'Health Records & Insights',
      description: 'Your health data & analytics',
      onClick: () => navigate('/health-tracking'),
      color: 'text-red-600'
    },
    {
      id: 'scan-medicines',
      icon: Scan,
      label: 'Scan Your Medicines',
      description: 'Scan barcode or upload prescription',
      onClick: () => navigate('/scan-medicines'),
      color: 'text-orange-600'
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Need Help?',
      description: 'FAQs, support & contact us',
      onClick: () => navigate('/help'),
      color: 'text-cyan-600'
    },
    {
      id: 'about',
      icon: Info,
      label: 'About Us',
      description: 'Learn about MedAI platform',
      onClick: () => navigate('/about'),
      color: 'text-indigo-600'
    }
  ];

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <main className="w-full max-w-6xl mx-auto py-8 px-4 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
              My Profile
            </h1>
            <p className="text-muted text-lg font-medium leading-relaxed">
              Manage your account and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div
                className="relative group cursor-pointer"
                onClick={() => !avatarUploading && fileInputRef.current?.click()}
                title="Click to change profile photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarUploading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {user?.name || 'User'}
                    </h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      user?.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      user?.role === 'doctor' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Patient'}
                    </span>
                  </div>
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {user?.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user?.mobile && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{user.mobile}</span>
                    </div>
                  )}
                  {user?.location && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {user?.date_of_birth && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>DOB: {new Date(user.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    )}
                    {user?.gender && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>Gender: {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</span>
                      </div>
                    )}
                    {user?.height && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Ruler className="w-4 h-4" />
                        <span>Height: {user.height} cm</span>
                      </div>
                    )}
                    {user?.weight && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Weight className="w-4 h-4" />
                        <span>Weight: {user.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-card-dark rounded-xl p-4 text-center">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.orders}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Orders</div>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl p-4 text-center">
              <TestTube className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.labTests}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Lab Tests</div>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl p-4 text-center">
              <Stethoscope className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.consultations}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Consultations</div>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.healthScore}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Health Score</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700 mb-6">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-opacity-10 ${item.color.replace('text-', 'bg-')} flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition">
                        {item.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>

          {/* Version Info */}
          <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            MedAI Platform v2.0.0
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-card-dark rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleFormChange}
                    placeholder="+91 1234567890"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="City, State"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Height and Weight */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleFormChange}
                      placeholder="170"
                      step="0.1"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleFormChange}
                      placeholder="70"
                      step="0.1"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ChatLayout>
  );
};

export default Profile;
