import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TestTube,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  FileText,
  MapPin,
  Download
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';

const MyLabTests = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/lab-tests/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching lab bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'confirmed':
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status?.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <main className="w-full max-w-6xl mx-auto py-8 px-4 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Profile
            </button>
            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
              My Lab Tests
            </h1>
            <p className="text-muted text-lg font-medium leading-relaxed">
              Your lab test bookings and reports
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Booked', value: bookings.length, color: 'text-blue-400' },
              { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: 'text-green-400' },
              { label: 'Upcoming', value: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length, color: 'text-yellow-400' },
              { label: 'In Progress', value: bookings.filter(b => b.status === 'in_progress').length, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card-dark rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {['all', 'completed', 'confirmed', 'in_progress', 'pending', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === s ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-card-dark rounded-xl p-12 text-center">
              <TestTube className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {filter === 'all' ? 'No lab tests booked yet' : `No ${filter.replace('_', ' ')} tests`}
              </h3>
              <p className="text-gray-400 mb-6">Book a lab test to monitor your health metrics</p>
              <button
                onClick={() => navigate('/lab-tests')}
                className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition"
              >
                Book a Lab Test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="bg-card-dark rounded-xl p-6 hover:bg-gray-800 transition">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <TestTube className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {booking.test_name || booking.tests?.join(', ') || 'Lab Test'}
                          </h3>
                          {booking.lab_name && (
                            <p className="text-gray-400 text-sm">{booking.lab_name}</p>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status?.replace('_', ' ').charAt(0).toUpperCase() + booking.status?.replace('_', ' ').slice(1)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-400 ml-13 mt-2">
                        {(booking.booking_date || booking.scheduled_date) && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.booking_date || booking.scheduled_date).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </div>
                        )}
                        {booking.time_slot && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {booking.time_slot}
                          </div>
                        )}
                        {booking.collection_address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {booking.collection_address}
                          </div>
                        )}
                      </div>

                      {/* Test Parameters */}
                      {booking.parameters && booking.parameters.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {booking.parameters.map((param, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-md text-xs">
                              {param}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Results */}
                      {booking.results && (
                        <div className="mt-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                          <p className="text-green-400 text-sm font-medium mb-1">Results Available</p>
                          <p className="text-gray-300 text-sm">{typeof booking.results === 'string' ? booking.results : JSON.stringify(booking.results)}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end gap-2">
                      {booking.price && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">₹{booking.price}</div>
                          <div className="text-xs text-gray-400">Test fee</div>
                        </div>
                      )}
                      {booking.status === 'completed' && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-700/30 text-green-400 rounded-lg text-sm hover:bg-green-700/50 transition">
                          <Download className="w-4 h-4" />
                          Download Report
                        </button>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition">
                          <FileText className="w-4 h-4" />
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Book More Button */}
          {bookings.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/lab-tests')}
                className="px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-semibold transition"
              >
                Book Another Test
              </button>
            </div>
          )}
        </main>
      </div>
    </ChatLayout>
  );
};

export default MyLabTests;
