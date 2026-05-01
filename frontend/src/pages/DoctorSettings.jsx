import React, { useState } from 'react';
import { Save, User, Bell, Clock } from 'lucide-react';

export default function DoctorSettings() {
  const [settings, setSettings] = useState({
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    email: 'dr.sarah@medai.com',
    phone: '+1 234-567-8900',
    address: '123 Medical Center, New York, NY 10001',
    consultationFee: '100',
    experience: '15',
    enableNotifications: true,
    enableEmailAlerts: true,
    autoConfirmAppointments: false,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: { start: '09:00', end: '17:00' },
  });

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const handleSave = () => alert('Settings saved successfully!');

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 dark:border-[#3d4d5d] rounded-xl bg-gray-50 dark:bg-[#283039] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm';

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
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Doctor Settings</h1>
              <p className="text-xs text-gray-500 dark:text-[#9dabb9]">Manage your profile and preferences</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Profile */}
        <div className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Profile Information</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Full Name</label>
                <input type="text" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Specialization</label>
                <input type="text" value={settings.specialization} onChange={e => setSettings({...settings, specialization: e.target.value})} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Phone</label>
                <input type="tel" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Clinic Address</label>
              <input type="text" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Consultation Fee ($)</label>
                <input type="number" value={settings.consultationFee} onChange={e => setSettings({...settings, consultationFee: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Years of Experience</label>
                <input type="number" value={settings.experience} onChange={e => setSettings({...settings, experience: e.target.value})} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Working Schedule */}
        <div className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Working Schedule</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-2">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <label
                    key={day}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition text-sm capitalize ${
                      settings.workingDays.includes(day)
                        ? 'border-primary bg-primary/5 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-[#283039] text-gray-500 dark:text-[#9dabb9] hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings.workingDays.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) setSettings({...settings, workingDays: [...settings.workingDays, day]});
                        else setSettings({...settings, workingDays: settings.workingDays.filter(d => d !== day)});
                      }}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">Start Time</label>
                <input type="time" value={settings.workingHours.start} onChange={e => setSettings({...settings, workingHours: {...settings.workingHours, start: e.target.value}})} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#9dabb9] uppercase tracking-wide mb-1.5">End Time</label>
                <input type="time" value={settings.workingHours.end} onChange={e => setSettings({...settings, workingHours: {...settings.workingHours, end: e.target.value}})} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-orange-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'enableNotifications', label: 'Enable Notifications', desc: 'Receive notifications for new appointments' },
              { key: 'enableEmailAlerts', label: 'Email Alerts', desc: 'Send email alerts for appointments' },
              { key: 'autoConfirmAppointments', label: 'Auto-confirm Appointments', desc: 'Automatically confirm new appointments' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#283039] rounded-xl cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9dabb9] mt-0.5">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}