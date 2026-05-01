import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, Video, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const APPOINTMENTS = [
  { id: 1, patientName: 'Alex Carter', patientAge: 32, patientPhone: '+1 555-234-7890', date: '2026-03-09', time: '10:00 AM', type: 'Video Call', reason: 'Diabetes follow-up & medication review', status: 'scheduled' },
  { id: 2, patientName: 'Mike Williams', patientAge: 45, patientPhone: '+1 555-678-1234', date: '2026-03-09', time: '11:30 AM', type: 'In-Person', reason: 'General checkup & blood pressure review', status: 'scheduled' },
  { id: 3, patientName: 'Emma Davis', patientAge: 29, patientPhone: '+1 555-324-7821', date: '2026-03-09', time: '02:00 PM', type: 'Video Call', reason: 'Prescription renewal — Metformin', status: 'completed' },
  { id: 4, patientName: 'Robert Chen', patientAge: 56, patientPhone: '+1 555-901-2347', date: '2026-03-08', time: '03:30 PM', type: 'In-Person', reason: 'HbA1c lab results discussion', status: 'completed' },
  { id: 5, patientName: 'Priya Patel', patientAge: 38, patientPhone: '+1 555-456-9012', date: '2026-03-10', time: '09:00 AM', type: 'Video Call', reason: 'Hypertension management', status: 'scheduled' },
  { id: 6, patientName: 'James Wilson', patientAge: 62, patientPhone: '+1 555-789-0123', date: '2026-03-10', time: '04:00 PM', type: 'In-Person', reason: 'Cardiac risk assessment', status: 'scheduled' },
  { id: 7, patientName: 'Sarah Lee', patientAge: 24, patientPhone: '+1 555-234-5678', date: '2026-03-07', time: '01:00 PM', type: 'Video Call', reason: 'Thyroid follow-up', status: 'cancelled' },
];

export default function DoctorAppointments() {
  const [appointments] = useState(APPOINTMENTS);
  const [filter, setFilter] = useState('all');

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
      completed: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20',
      cancelled: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20',
    };
    return styles[status] || styles.scheduled;
  };

  const getStatusIcon = (status) => {
    const icons = { scheduled: AlertCircle, completed: CheckCircle, cancelled: XCircle };
    const Icon = icons[status] || icons.scheduled;
    return <Icon className="w-3.5 h-3.5" />;
  };

  const filteredAppointments = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#101922]">
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#111418] border-b border-gray-200 dark:border-[#283039] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Appointments</h1>
            <p className="text-xs text-gray-500 dark:text-[#9dabb9]">Manage your appointment schedule</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter Tabs */}
        <div className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-1.5 flex gap-1">
          {['all', 'scheduled', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium capitalize transition-colors ${
                filter === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 dark:text-[#9dabb9] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Appointment List */}
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039]">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#283039] flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-[#9dabb9] font-medium">No appointments found</p>
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <div key={apt.id} className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl p-5 hover:border-primary/30 dark:hover:border-primary/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{apt.patientName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                        {getStatusIcon(apt.status)}
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#9dabb9] mb-2">{apt.patientAge} yrs · {apt.reason}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-[#9dabb9]">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{apt.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{apt.time}</span>
                      <span className="flex items-center gap-1">
                        {apt.type === 'Video Call' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                        {apt.type}
                      </span>
                    </div>
                  </div>
                  {apt.status === 'scheduled' && (
                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                      <button className="px-3 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-xs font-medium">
                        Start
                      </button>
                      <button className="px-3 py-1.5 border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-[#9dabb9] rounded-xl hover:bg-gray-50 dark:hover:bg-[#283039] transition text-xs font-medium">
                        Reschedule
                      </button>
                      <button className="px-3 py-1.5 border border-red-100 dark:border-red-500/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition text-xs font-medium">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}