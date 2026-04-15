import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  User,
  FileText,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';

const MOCK_CONSULTATIONS = [
  {
    _id: 'c1',
    doctor_name: 'Dr. Sarah Johnson',
    specialization: 'Diabetologist & Endocrinologist',
    status: 'completed',
    date: '2026-02-10',
    time: '10:30 AM',
    consultation_type: 'video',
    duration: '30 mins',
    chief_complaint: 'Diabetes follow-up & HbA1c review',
    prescription_given: true,
    fee: 800,
    notes: 'HbA1c improved to 7.2%. Continue Metformin. Reduce carb intake. Next review in 3 months.',
  },
  {
    _id: 'c2',
    doctor_name: 'Dr. Sarah Johnson',
    specialization: 'Diabetologist & Endocrinologist',
    status: 'completed',
    date: '2026-01-05',
    time: '11:00 AM',
    consultation_type: 'video',
    duration: '25 mins',
    chief_complaint: 'Hypertension management & BP control',
    prescription_given: true,
    fee: 800,
    notes: 'BP stabilizing at 130/85. Continue Amlodipine 5mg. Sodium restriction advised.',
  },
  {
    _id: 'c3',
    doctor_name: 'Dr. Sarah Johnson',
    specialization: 'Diabetologist & Endocrinologist',
    status: 'scheduled',
    date: '2026-03-15',
    time: '10:00 AM',
    consultation_type: 'video',
    duration: '30 mins',
    chief_complaint: 'Quarterly diabetes & BP check-up',
    prescription_given: false,
    fee: 800,
    notes: '',
  },
  {
    _id: 'c4',
    doctor_name: 'Dr. Sarah Johnson',
    specialization: 'Diabetologist & Endocrinologist',
    status: 'completed',
    date: '2025-12-12',
    time: '09:30 AM',
    consultation_type: 'chat',
    duration: '20 mins',
    chief_complaint: 'Upper respiratory infection symptoms',
    prescription_given: true,
    fee: 400,
    notes: 'Prescribed Azithromycin 500mg for 5 days. Rest and hydration advised.',
  },
];

export default function Consultations() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/consultations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const apiConsultations = data.consultations || data.data || [];
        setConsultations(apiConsultations.length > 0 ? apiConsultations : MOCK_CONSULTATIONS);
      } else {
        setConsultations(MOCK_CONSULTATIONS);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
      setConsultations(MOCK_CONSULTATIONS);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'upcoming':
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Stethoscope className="w-5 h-5" />;
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    if (filter === 'all') return true;
    return consultation.status?.toLowerCase() === filter;
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
              My Consultations
            </h1>
            <p className="text-muted text-lg font-medium leading-relaxed">
              Past and upcoming doctor consultations
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {['all', 'upcoming', 'scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Consultations List */}
          {filteredConsultations.length === 0 ? (
            <div className="bg-card-dark rounded-xl p-12 text-center">
              <Stethoscope className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {filter === 'all' ? 'No consultations yet' : `No ${filter} consultations`}
              </h3>
              <p className="text-gray-400 mb-6">
                {filter === 'all'
                  ? 'Book a consultation with a doctor to get started'
                  : `You don't have any ${filter} consultations`}
              </p>
              <button
                onClick={() => navigate('/chatbot')}
                className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition"
              >
                Consult via AI Chatbot
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultations.map((consultation) => (
                <div
                  key={consultation._id || consultation.id}
                  className="bg-card-dark rounded-xl p-6 hover:bg-gray-800 transition"
                >
                  {/* Consultation Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          {consultation.doctor_name || 'Dr. Unknown'}
                        </h3>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                          {getStatusIcon(consultation.status)}
                          {consultation.status?.charAt(0).toUpperCase() + consultation.status?.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-3">
                        {consultation.specialization || 'General Physician'}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(consultation.date || consultation.appointment_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {consultation.time || new Date(consultation.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
                          consultation.consultation_type === 'video' ? 'bg-blue-900/30 text-blue-400' :
                          consultation.consultation_type === 'phone' ? 'bg-green-900/30 text-green-400' :
                          'bg-purple-900/30 text-purple-400'
                        }`}>
                          {getTypeIcon(consultation.consultation_type)}
                          {consultation.consultation_type?.charAt(0).toUpperCase() + consultation.consultation_type?.slice(1)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                      {consultation.status === 'upcoming' || consultation.status === 'scheduled' ? (
                        <button
                          onClick={() => {
                            if (consultation.consultation_type === 'video') {
                              window.open(consultation.meeting_link, '_blank');
                            } else if (consultation.consultation_type === 'chat') {
                              navigate('/chatbot');
                            }
                          }}
                          className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition"
                        >
                          Join Now
                        </button>
                      ) : null}
                      <button
                        onClick={() => navigate(`/consultations/${consultation._id || consultation.id}`)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Consultation Details */}
                  {consultation.reason && (
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-3">
                      <h4 className="text-white font-medium mb-2">Reason for Visit</h4>
                      <p className="text-gray-400 text-sm">{consultation.reason}</p>
                    </div>
                  )}

                  {/* Prescription Link */}
                  {consultation.status === 'completed' && consultation.prescription_id && (
                    <div className="flex items-center gap-2 text-sm text-primary hover:text-blue-400 cursor-pointer"
                         onClick={() => navigate(`/prescriptions/${consultation.prescription_id}`)}>
                      <FileText className="w-4 h-4" />
                      View Prescription
                    </div>
                  )}

                  {/* Notes or Diagnosis */}
                  {consultation.notes && (
                    <div className="mt-3 text-sm text-gray-400">
                      <span className="font-medium text-white">Notes: </span>
                      {consultation.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ChatLayout>
  );
}
