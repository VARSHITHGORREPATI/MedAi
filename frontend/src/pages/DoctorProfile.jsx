import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Clock, Save, LogOut, Edit2, X, Star, Users, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DoctorProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Dr. Sarah Johnson',
    specialization: user?.specialization || 'Cardiology',
    email: user?.email || 'doctor@medai.com',
    phone: user?.phone || '+1 234-567-8900',
    address: user?.address || '123 Medical Center, New York, NY 10001',
    experience: user?.experience || '15',
    consultationFee: user?.consultationFee || '100',
    bio: user?.bio || 'Experienced cardiologist specializing in preventive cardiology and heart failure management.',
  });
  const [draft, setDraft] = useState(profile);

  const handleEdit = () => {
    setDraft({ ...profile });
    setEditing(true);
  };

  const handleSave = () => {
    setProfile({ ...draft });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...profile });
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 dark:border-[#3d4d5d] rounded-xl bg-gray-50 dark:bg-[#283039] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm';

  const stats = [
    { icon: Users, label: 'Total Patients', value: '124', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: FileText, label: 'Prescriptions', value: '89', color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: Calendar, label: 'Appointments', value: '312', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Star, label: 'Rating', value: '4.9', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#101922]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#111418] border-b border-gray-200 dark:border-[#283039] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">My Profile</h1>
              <p className="text-xs text-gray-500 dark:text-[#9dabb9]">View and manage your doctor profile</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-[#9dabb9] px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#283039] transition text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {profile.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
              <p className="text-sm text-primary font-medium mt-0.5">{profile.specialization}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#9dabb9]">
                  <Mail className="w-3.5 h-3.5" />{profile.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#9dabb9]">
                  <Briefcase className="w-3.5 h-3.5" />{profile.experience} yrs experience
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-[#9dabb9] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Personal Information */}
        <div className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Full Name</label>
                {editing ? (
                  <input className={inputClass} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{profile.name}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Specialization</label>
                {editing ? (
                  <input className={inputClass} value={draft.specialization} onChange={e => setDraft({ ...draft, specialization: e.target.value })} />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                    <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{profile.specialization}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Email Address</label>
                {editing ? (
                  <input type="email" className={inputClass} value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{profile.email}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Phone Number</label>
                {editing ? (
                  <input type="tel" className={inputClass} value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Years of Experience</label>
                {editing ? (
                  <input type="number" className={inputClass} value={draft.experience} onChange={e => setDraft({ ...draft, experience: e.target.value })} />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{profile.experience} years</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Consultation Fee ($)</label>
                {editing ? (
                  <input type="number" className={inputClass} value={draft.consultationFee} onChange={e => setDraft({ ...draft, consultationFee: e.target.value })} />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                    <span className="text-sm font-semibold text-gray-400">$</span>
                    <span className="text-sm text-gray-900 dark:text-white">{profile.consultationFee}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Clinic Address</label>
              {editing ? (
                <input className={inputClass} value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-900 dark:text-white">{profile.address}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] mb-1.5">Bio</label>
              {editing ? (
                <textarea
                  rows={3}
                  className={inputClass + ' resize-none'}
                  value={draft.bio}
                  onChange={e => setDraft({ ...draft, bio: e.target.value })}
                />
              ) : (
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#283039] rounded-xl">
                  <span className="text-sm text-gray-900 dark:text-white">{profile.bio}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
