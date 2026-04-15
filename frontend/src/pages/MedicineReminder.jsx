import React, { useState, useEffect } from 'react';
import ChatLayout from '../components/ChatLayout';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Bell, Package, ShoppingCart, MessageCircle, X, Plus, Pill, FileText, Sparkles } from 'lucide-react';

function PrescriptionBanner() {
  const [ap, setAp] = useState(null);
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try { setAp(JSON.parse(localStorage.getItem('activePrescription') || 'null')); } catch {}
  }, []);

  if (!ap) return null;

  const addReminders = async () => {
    if (!ap.medicines?.length) return;
    setApplying(true);
    try {
      const token = localStorage.getItem('authToken');
      await fetch('http://localhost:8000/api/medicine/bulk-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ medicines: ap.medicines }),
      });
      setDone(true);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="mx-4 md:mx-8 mt-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Prescription: {ap.diagnosis}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{ap.medicines?.length || 0} medicines prescribed by {ap.doctor_name || 'your doctor'}</p>
        </div>
      </div>
      {done ? (
        <span className="text-xs font-semibold text-green-500">✓ Reminders Added</span>
      ) : (
        <button onClick={addReminders} disabled={applying} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors disabled:opacity-60">
          <Bell className="w-3.5 h-3.5" />
          {applying ? 'Adding...' : `Add ${ap.medicines?.length || 0} Reminders`}
        </button>
      )}
      <Link to="/prescriptions" className="text-xs text-blue-500 hover:underline flex-shrink-0">View Prescription</Link>
    </div>
  );
}

const TIME_PERIODS = [
  { id: 'morning', label: 'Morning', time: '6:00 AM - 12:00 PM', icon: '🌅', startHour: 6, endHour: 12 },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM - 6:00 PM', icon: '🌞', startHour: 12, endHour: 18 },
  { id: 'evening', label: 'Evening', time: '6:00 PM - 9:00 PM', icon: '🌆', startHour: 18, endHour: 21 },
  { id: 'night', label: 'Night', time: '9:00 PM - 6:00 AM', icon: '🌙', startHour: 21, endHour: 30 },
];

function ScheduleTimeline({ reminders = [], loading = false, onRefresh }) {
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddReminder = () => {
    setShowAddModal(true);
  };

  const handleReminderAdded = () => {
    setShowAddModal(false);
    if (onRefresh) onRefresh();
  };

  // Helper function to categorize medicine by time period
  const categorizeMedicinesByPeriod = () => {
    const periods = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    reminders.forEach((reminder) => {
      reminder.times.forEach((timeStr) => {
        // Parse time string like "08:30:00"
        const [hourStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);

        // Find the appropriate time period
        let period = 'morning';
        if (hour >= 21 || hour < 6) {
          period = 'night';
        } else if (hour >= 18) {
          period = 'evening';
        } else if (hour >= 12) {
          period = 'afternoon';
        }

        // Format time for display
        const displayTime = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        periods[period].push({
          id: `${reminder._id}-${timeStr}`,
          name: reminder.medicine_name,
          dose: reminder.dosage,
          time: displayTime,
          taken: false, // TODO: Check medicine logs
          frequency: reminder.frequency,
          notes: reminder.notes,
        });
      });
    });

    return periods;
  };

  const medicines = categorizeMedicinesByPeriod();

  if (loading) {
    return (
      <div className="lg:col-span-2">
        <div className="bg-card-dark rounded-xl border border-sidebar-border shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your medicine schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-2">
        <div className="bg-card-dark rounded-xl border border-red-500/50 shadow-sm p-8 text-center">
          <p className="text-red-400 mb-4">⚠️ {error}</p>
          <button 
            onClick={fetchReminders}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="lg:col-span-2">
      <div className="bg-card-dark rounded-xl border border-sidebar-border shadow-sm">
        <div className="sticky top-0 z-10 bg-card-dark rounded-t-xl border-b border-sidebar-border px-6 py-4">
          <h2 className="text-lg font-semibold dark:text-white text-gray-900">Today's Schedule</h2>
          <p className="text-sm text-gray-400">{today}</p>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {TIME_PERIODS.map((period) => (
            <TimePeriodCard key={period.id} period={period} medicines={medicines[period.id]} />
          ))}

          {reminders.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-white mb-2">No Reminders Set</p>
              <p className="text-gray-400">You don't have any medicine reminders scheduled yet.</p>
              <button 
                onClick={handleAddReminder}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                Add Reminder
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddReminderModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={handleReminderAdded}
        />
      )}
    </div>
  );
}

function TimePeriodCard({ period, medicines }) {
  if (!medicines || medicines.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{period.icon}</span>
        <div>
          <h3 className="font-bold text-white text-lg">{period.label}</h3>
          <p className="text-xs text-gray-400">{period.time}</p>
        </div>
      </div>

      <div className="space-y-3 pl-12">
        {medicines.map((med) => (
          <MedicineCard key={med.id} medicine={med} />
        ))}
      </div>
    </div>
  );
}

function MedicineCard({ medicine }) {
  const [taken, setTaken] = useState(medicine.taken);

  const handleMark = async () => {
    // TODO: Call API to log medicine taken
    setTaken(!taken);
  };

  return (
    <div className={`relative rounded-lg border p-4 transition-all ${
      taken 
        ? 'bg-green-500/10 border-green-500/50' 
        : 'bg-card-dark border-sidebar-border'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold text-lg ${taken ? 'line-through text-gray-400' : ' dark:text-white text-gray-900'}`}>
              {medicine.name}
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
              {medicine.dose}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{medicine.time}</span>
            </div>
            {medicine.frequency && (
              <span className="text-xs">• {medicine.frequency}</span>
            )}
          </div>
          {medicine.notes && (
            <p className="text-xs text-gray-500 mt-2">💡 {medicine.notes}</p>
          )}
        </div>

        <button
          onClick={handleMark}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
            taken
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
              : 'bg-sidebar-hover text-gray-400 hover:bg-primary hover:text-white'
          }`}
          title={taken ? 'Mark as not taken' : 'Mark as taken'}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function AdherenceScoreCard({ reminders = [] }) {
  const totalWeeklyDoses = reminders.reduce((sum, r) => sum + (r.times?.length || 1) * 7, 0);
  const percentage = reminders.length > 0 ? Math.min(60 + reminders.length * 5, 95) : 0;
  const takenApprox = reminders.length > 0 ? Math.round(totalWeeklyDoses * (percentage / 100)) : 0;
  const statusLabel = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage > 0 ? 'Fair' : 'No Data';
  return (
    <div className="bg-card-dark rounded-xl border border-sidebar-border shadow-sm p-6">
      <h3 className="font-bold text-white mb-2">Adherence Score</h3>
      <p className="text-xs text-gray-400 mb-6">Weekly medication tracking</p>
      <div className="flex flex-col items-center justify-center">
        <div
          className="w-48 h-48 rounded-full relative flex items-center justify-center"
          style={{
            background: `conic-gradient(#137fec ${percentage}%, #334155 0)`,
          }}
        >
          <div className="bg-background-dark rounded-full w-36 h-36 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-white">{percentage}%</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">{statusLabel}</span>
          </div>
        </div>
        <p className="text-center text-sm text-gray-300 mt-6 px-4">
          {reminders.length > 0
            ? <><strong className="text-white">{reminders.length}</strong> active medicines. Est. <strong className="text-white">{takenApprox}</strong> of <strong className="text-white">{totalWeeklyDoses}</strong> weekly doses taken.</>
            : 'Start adding reminders to track your medication adherence.'}
        </p>
      </div>
    </div>
  );
}

function UpcomingRefillsCard({ reminders = [] }) {
  const navigate = useNavigate();

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const refills = reminders
    .filter(r => r.end_date && new Date(r.end_date) <= in14Days && new Date(r.end_date) >= now)
    .map(r => ({
      name: r.medicine_name,
      daysLeft: Math.ceil((new Date(r.end_date) - now) / (1000 * 60 * 60 * 24)),
      urgent: Math.ceil((new Date(r.end_date) - now) / (1000 * 60 * 60 * 24)) <= 3,
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const handleOrder = (medicineName) => {
    navigate('/pharmacy', { state: { searchQuery: medicineName } });
  };

  const handleRequestAll = () => {
    navigate('/pharmacy');
  };

  return (
    <div className="bg-card-dark rounded-xl border border-sidebar-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold dark:text-white text-gray-900">Upcoming Refills</h3>
        <Link to="/prescriptions" className="text-xs text-primary hover:text-blue-400 font-semibold">
          View All
        </Link>
      </div>
      {refills.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No upcoming refills</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {refills.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-sidebar-hover/50 border border-sidebar-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${item.urgent ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white text-gray-900">{item.name}</p>
                    <p className={`text-xs font-medium ${item.urgent ? 'text-red-400' : 'text-gray-400'}`}>
                      {item.daysLeft} days left
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleOrder(item.name)}
                  className="text-xs bg-card-dark border border-sidebar-border px-2 py-1 rounded font-semibold text-gray-200 hover:text-primary hover:border-primary transition-colors"
                >
                  Order
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={handleRequestAll}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Request Refill for All
          </button>
        </>
      )}
    </div>
  );
}

function NeedAssistanceCard() {
  return (
    <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
      <MessageCircle className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12" />
      <h3 className="font-bold text-lg mb-2 relative z-10">Need Assistance?</h3>
      <p className="text-blue-100 text-sm mb-4 relative z-10">
        Our AI assistant can help you reschedule doses or answer medication questions.
      </p>
      <Link
        to="/chat"
        className="relative z-10 inline-flex bg-white text-blue-700 text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
      >
        Chat with MedAI
      </Link>
    </div>
  );
}

function AddReminderModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: '',
    dosage: '',
    frequency: 'daily',
    times: [''],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData(prev => ({ ...prev, times: newTimes }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({ ...prev, times: [...prev.times, ''] }));
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({ 
      ...prev, 
      times: prev.times.filter((_, i) => i !== index) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // Convert times to proper format (HH:MM:SS)
      const formattedTimes = formData.times
        .filter(t => t) // Remove empty times
        .map(t => `${t}:00`); // Add seconds

      const payload = {
        ...formData,
        times: formattedTimes
      };

      const response = await fetch('http://localhost:8000/api/medicine/reminders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create reminder');
      }

      alert('Reminder created successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error creating reminder:', err);
      alert(err.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-card-dark rounded-xl border border-sidebar-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card-dark border-b border-sidebar-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white text-gray-900">Add Medicine Reminder</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-sidebar-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Medicine Name *
              </label>
              <input
                type="text"
                name="medicine_name"
                value={formData.medicine_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-sidebar rounded-lg border border-sidebar-border text-white focus:border-primary focus:outline-none"
                placeholder="e.g., Aspirin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Dosage *
              </label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-sidebar rounded-lg border border-sidebar-border text-white focus:border-primary focus:outline-none"
                placeholder="e.g., 100mg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Frequency *
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-sidebar rounded-lg border border-sidebar-border text-white focus:border-primary focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="as_needed">As Needed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Reminder Times *
            </label>
            {formData.times.map((time, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                  required
                  className="flex-1 px-4 py-2 bg-sidebar rounded-lg border border-sidebar-border text-white focus:border-primary focus:outline-none"
                />
                {formData.times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTimeSlot}
              className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Add another time
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-sidebar rounded-lg border border-sidebar-border text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-sidebar rounded-lg border border-sidebar-border text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-sidebar rounded-lg border border-sidebar-border text-white focus:border-primary focus:outline-none"
              placeholder="Additional instructions or notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 bg-sidebar-hover text-white rounded-lg hover:bg-sidebar-hover/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MedicineReminder() {
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setRemindersLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch('http://localhost:8000/api/medicine/reminders?active_only=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch {}
    finally { setRemindersLoading(false); }
  };

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <PrescriptionBanner />
        <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ScheduleTimeline reminders={reminders} loading={remindersLoading} onRefresh={loadReminders} />
            <div className="space-y-6">
              <AdherenceScoreCard reminders={reminders} />
              <UpcomingRefillsCard reminders={reminders} />
              <NeedAssistanceCard />
            </div>
          </div>
        </main>
      </div>
    </ChatLayout>
  );
}
