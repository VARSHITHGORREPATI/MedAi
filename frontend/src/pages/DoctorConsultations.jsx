import React, { useState } from 'react';
import { Video, Phone, MessageSquare, Calendar, Clock, User } from 'lucide-react';

const CONSULTATIONS = [
  { id: 1, patientName: 'John Smith', patientAge: 45, type: 'video', status: 'scheduled', date: '2026-03-08', time: '10:00 AM', duration: 30, complaint: 'Follow-up checkup for diabetes management' },
  { id: 2, patientName: 'Emily Davis', patientAge: 32, type: 'phone', status: 'in-progress', date: '2026-03-08', time: '09:30 AM', duration: 20, complaint: 'Cold symptoms and fever' },
  { id: 3, patientName: 'Michael Brown', patientAge: 58, type: 'video', status: 'completed', date: '2026-03-07', time: '02:00 PM', duration: 45, complaint: 'Hypertension consultation' },
];

export default function DoctorConsultations() {
  const [filter, setFilter] = useState('all');

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      'in-progress': 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      completed: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400',
      cancelled: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    };
    return styles[status] || styles.scheduled;
  };

  const getTypeIcon = (type) => type === 'video' ? Video : type === 'phone' ? Phone : MessageSquare;

  const filtered = filter === 'all' ? CONSULTATIONS : CONSULTATIONS.filter(c => c.status === filter);

  const stats = [
    { label: "Today's Consultations", value: 8, color: 'text-gray-900 dark:text-white' },
    { label: 'In Progress', value: 1, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Completed Today', value: 5, color: 'text-green-600 dark:text-green-400' },
    { label: 'Upcoming', value: 2, color: 'text-blue-600 dark:text-blue-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#101922]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#111418] border-b border-gray-200 dark:border-[#283039] px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Consultations</h1>
              <p className="text-xs text-gray-500 dark:text-[#9dabb9]">Manage patient consultations</p>
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-[#3d4d5d] rounded-xl bg-gray-50 dark:bg-[#283039] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Consultations</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-4">
              <p className="text-xs text-gray-500 dark:text-[#9dabb9]">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((c) => {
            const TypeIcon = getTypeIcon(c.type);
            return (
              <div key={c.id} className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl p-5 hover:border-primary/30 dark:hover:border-primary/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <TypeIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{c.patientName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>
                        {c.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-[#9dabb9] mb-2">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{c.patientAge} yrs</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{c.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.time} ({c.duration} min)</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{c.complaint}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {c.status === 'scheduled' && (
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-xs font-medium">Start</button>
                    )}
                    {c.status === 'in-progress' && (
                      <button className="px-3 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-xs font-medium">Join</button>
                    )}
                    <button className="px-3 py-1.5 border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-[#9dabb9] rounded-xl hover:bg-gray-50 dark:hover:bg-[#283039] transition text-xs font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}