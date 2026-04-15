import { useState, useEffect } from 'react';
import { Search, User, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/doctor/patients');
      if (response.data.success) {
        setPatients(response.data.data);
      } else {
        setError(response.data.detail || 'Failed to load patients');
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.detail || 'Could not connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#101922]">
      {/* Sticky header with search */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#111418] border-b border-gray-200 dark:border-[#283039] px-6 py-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">My Patients</h1>
            {!loading && !error && (
              <p className="text-xs text-gray-500 dark:text-[#9dabb9]">{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-[#3d4d5d] rounded-xl bg-gray-50 dark:bg-[#283039] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9dabb9] focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-[#283039] rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-[#283039] rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-[#283039] rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-gray-100 dark:bg-[#283039] rounded-xl" />
                  <div className="h-10 bg-gray-100 dark:bg-[#283039] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Failed to load patients</h3>
            <p className="text-sm text-gray-500 dark:text-[#9dabb9] mb-4">{error}</p>
            <button onClick={fetchPatients} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-blue-600 transition text-sm font-medium">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              {search ? 'No patients match your search' : 'No patients yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#9dabb9]">
              {search ? 'Try a different name or email address.' : 'Patients will appear here once you create prescriptions for them.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 px-4 py-2 text-primary hover:underline text-sm">
                Clear search
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredPatients.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map(patient => (
              <div
                key={patient._id}
                onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                className="bg-white dark:bg-[#1b252f] rounded-2xl border border-gray-100 dark:border-[#283039] p-5 hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md dark:hover:shadow-primary/5 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{patient.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-[#9dabb9] truncate">{patient.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-[#283039] rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-[#9dabb9]">Prescriptions</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{patient.prescription_count || 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#283039] rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-[#9dabb9]">Last Visit</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}