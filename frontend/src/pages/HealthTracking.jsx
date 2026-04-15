import { useState, useEffect } from 'react';
import { 
    Activity, Heart, Droplets, Moon, TrendingUp, Weight, ThermometerSun, 
    Plus, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Minus,
    Smile, Frown, Meh, Zap, Sparkles, Stethoscope, TestTube
} from 'lucide-react';
import { Link } from 'react-router-dom';

function PrescriptionHealthBanner() {
  const [ap, setAp] = useState(null);
  useEffect(() => {
    try { setAp(JSON.parse(localStorage.getItem('activePrescription') || 'null')); } catch {}
  }, []);
  if (!ap) return null;
  return (
    <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex flex-wrap items-start gap-3">
      <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Active Health Condition: {ap.diagnosis}</p>
        <div className="flex flex-wrap gap-3 mt-2">
          {ap.medicines?.slice(0, 3).map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300">
              <Stethoscope className="w-3 h-3" />{m.name} {m.dosage}
            </span>
          ))}
          {ap.lab_tests?.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              <TestTube className="w-3 h-3" />{ap.lab_tests.join(', ')}
            </span>
          )}
        </div>
      </div>
      <Link to="/prescriptions" className="text-xs text-blue-400 hover:underline flex-shrink-0">Prescription</Link>
    </div>
  );
}
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { healthAPI } from '../services/api';
import ChatLayout from '../components/ChatLayout';

export default function HealthTracking() {
    const [showAddLog, setShowAddLog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [healthLogs, setHealthLogs] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        fetch('http://localhost:8000/api/health/logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => setHealthLogs(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const [formData, setFormData] = useState({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        bloodSugar: '',
        heartRate: '',
        weight: '',
        temperature: '',
        oxygenLevel: '',
        sleep: '',
        exercise: '',
        mood: 'good',
        notes: ''
    });

    const logsDesc = [...healthLogs].sort((a, b) => (a.date < b.date ? 1 : -1));
    const latestLog = logsDesc[0];
    const bloodPressureData = logsDesc.slice(0, 14).reverse()
        .map(log => ({
            date: log.date ? log.date.slice(5) : '',
            systolic: log.vital_signs?.blood_pressure_systolic,
            diastolic: log.vital_signs?.blood_pressure_diastolic,
        }))
        .filter(d => d.systolic);
    const weightData = logsDesc.slice(0, 14).reverse()
        .map(log => ({
            date: log.date ? log.date.slice(5) : '',
            value: log.vital_signs?.weight,
        }))
        .filter(d => d.value);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const logData = {
                date: new Date().toISOString(),
                vitals: {
                    bloodPressure: {
                        systolic: parseInt(formData.bloodPressureSystolic) || null,
                        diastolic: parseInt(formData.bloodPressureDiastolic) || null
                    },
                    bloodSugar: parseInt(formData.bloodSugar) || null,
                    heartRate: parseInt(formData.heartRate) || null,
                    weight: parseFloat(formData.weight) || null,
                    temperature: parseFloat(formData.temperature) || null,
                    oxygenLevel: parseInt(formData.oxygenLevel) || null
                },
                sleep: parseFloat(formData.sleep) || null,
                exercise: parseInt(formData.exercise) || null,
                mood: formData.mood,
                notes: formData.notes
            };

            await healthAPI.addHealthLog(logData);
            setShowAddLog(false);
            // Reset form
            setFormData({
                bloodPressureSystolic: '',
                bloodPressureDiastolic: '',
                bloodSugar: '',
                heartRate: '',
                weight: '',
                temperature: '',
                oxygenLevel: '',
                sleep: '',
                exercise: '',
                mood: 'good',
                notes: ''
            });
        } catch (error) {
            console.error('Error saving health log:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend) => {
        if (trend === 'up') return <ArrowUp className="w-4 h-4 text-red-500" />;
        if (trend === 'down') return <ArrowDown className="w-4 h-4 text-green-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const vitalsCards = [
        {
            icon: Heart,
            label: 'Blood Pressure',
            value: latestLog?.vital_signs?.blood_pressure_systolic
                ? `${latestLog.vital_signs.blood_pressure_systolic}/${latestLog.vital_signs.blood_pressure_diastolic}`
                : '-',
            unit: 'mmHg',
            trend: 'stable',
            status: latestLog?.vital_signs?.blood_pressure_systolic ? 'tracked' : 'no data',
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20'
        },
        {
            icon: Droplets,
            label: 'Blood Sugar',
            value: latestLog?.vital_signs?.blood_sugar
                ? Math.round(latestLog.vital_signs.blood_sugar)
                : '-',
            unit: 'mg/dL',
            trend: 'stable',
            status: latestLog?.vital_signs?.blood_sugar ? 'tracked' : 'no data',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            icon: Weight,
            label: 'Weight',
            value: latestLog?.vital_signs?.weight ?? '-',
            unit: 'kg',
            trend: 'stable',
            status: latestLog?.vital_signs?.weight ? 'tracked' : 'no data',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20'
        },
        {
            icon: ThermometerSun,
            label: 'Temperature',
            value: latestLog?.vital_signs?.temperature
                ? (latestLog.vital_signs.temperature * 9 / 5 + 32).toFixed(1)
                : '-',
            unit: '°F',
            trend: 'stable',
            status: latestLog?.vital_signs?.temperature ? 'tracked' : 'no data',
            color: 'text-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20'
        },
        {
            icon: Activity,
            label: 'Heart Rate',
            value: latestLog?.vital_signs?.heart_rate ?? '-',
            unit: 'bpm',
            trend: 'stable',
            status: latestLog?.vital_signs?.heart_rate ? 'tracked' : 'no data',
            color: 'text-pink-500',
            bgColor: 'bg-pink-50 dark:bg-pink-900/20'
        },
        {
            icon: Moon,
            label: 'SpO2',
            value: latestLog?.vital_signs?.oxygen_saturation ?? '-',
            unit: '%',
            trend: 'stable',
            status: latestLog?.vital_signs?.oxygen_saturation ? 'tracked' : 'no data',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
        },
    ];

    return (
        <ChatLayout>
            <div className="w-full h-full overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-card-dark border-b border-sidebar-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Health Tracking</h1>
                            <p className="text-sm text-gray-400 mt-1">Monitor your vitals and recovery progress</p>
                        </div>
                        <button
                            onClick={() => setShowAddLog(!showAddLog)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            {showAddLog ? 'Cancel' : 'Add Log'}
                        </button>
                    </div>
                </div>

                <PrescriptionHealthBanner />

                <div className="p-6 space-y-6">
                    {/* Add Log Form */}
                    {showAddLog && (
                        <div className="bg-card-dark border border-sidebar-border rounded-xl p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Log Today's Metrics</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Vitals Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Blood Pressure */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Blood Pressure (mmHg)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Systolic"
                                                value={formData.bloodPressureSystolic}
                                                onChange={(e) => handleInputChange('bloodPressureSystolic', e.target.value)}
                                                className="flex-1 px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Diastolic"
                                                value={formData.bloodPressureDiastolic}
                                                onChange={(e) => handleInputChange('bloodPressureDiastolic', e.target.value)}
                                                className="flex-1 px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    {/* Blood Sugar */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Blood Sugar (mg/dL)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter blood sugar"
                                            value={formData.bloodSugar}
                                            onChange={(e) => handleInputChange('bloodSugar', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Heart Rate */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Heart Rate (bpm)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter heart rate"
                                            value={formData.heartRate}
                                            onChange={(e) => handleInputChange('heartRate', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="Enter weight"
                                            value={formData.weight}
                                            onChange={(e) => handleInputChange('weight', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Temperature */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Temperature (°F)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="Enter temperature"
                                            value={formData.temperature}
                                            onChange={(e) => handleInputChange('temperature', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Oxygen Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Oxygen Level (%)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter SpO2"
                                            value={formData.oxygenLevel}
                                            onChange={(e) => handleInputChange('oxygenLevel', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Sleep Hours */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Sleep (hours)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            placeholder="Enter sleep hours"
                                            value={formData.sleep}
                                            onChange={(e) => handleInputChange('sleep', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Exercise */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                            Exercise (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter exercise time"
                                            value={formData.exercise}
                                            onChange={(e) => handleInputChange('exercise', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Mood */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                                        How are you feeling?
                                    </label>
                                    <div className="flex gap-4">
                                        {[
                                            { value: 'great', icon: Smile, label: 'Great', color: 'text-green-400' },
                                            { value: 'good', icon: Smile, label: 'Good', color: 'text-blue-400' },
                                            { value: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-400' },
                                            { value: 'bad', icon: Frown, label: 'Bad', color: 'text-red-400' },
                                        ].map((mood) => (
                                            <button
                                                key={mood.value}
                                                type="button"
                                                onClick={() => handleInputChange('mood', mood.value)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                                                    formData.mood === mood.value
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-sidebar-border bg-surface-dark hover:border-gray-600'
                                                }`}
                                            >
                                                <mood.icon className={`w-8 h-8 ${mood.color}`} />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mood.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        placeholder="Any symptoms, observations, or notes..."
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-surface-dark border border-sidebar-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Log'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddLog(false)}
                                        className="px-6 py-3 bg-surface-dark hover:bg-sidebar-hover border border-sidebar-border text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Vitals Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vitalsCards.map((vital, index) => (
                            <div
                                key={index}
                                className="bg-card-dark border border-sidebar-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${vital.bgColor}`}>
                                        <vital.icon className={`w-6 h-6 ${vital.color}`} />
                                    </div>
                                    {getTrendIcon(vital.trend)}
                                </div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{vital.label}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{vital.value}</span>
                                    <span className="text-sm text-gray-400">{vital.unit}</span>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    {vital.status === 'no data' ? (
                                        <AlertCircle className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                    <span className={`text-xs font-medium capitalize ${vital.status === 'no data' ? 'text-gray-400' : 'text-green-400'}`}>{vital.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Blood Pressure Chart */}
                        <div className="bg-card-dark border border-sidebar-border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Blood Pressure Trend</h2>
                                <button className="text-sm text-primary hover:underline">Last 7 Days</button>
                            </div>
                            {bloodPressureData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[250px] text-gray-400">
                                    <Heart className="w-12 h-12 mb-3 text-gray-600" />
                                    <p className="text-sm">No blood pressure data yet</p>
                                    <p className="text-xs text-gray-500 mt-1">Start logging to see trends</p>
                                </div>
                            ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={bloodPressureData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="systolic"
                                        stroke="#EF4444"
                                        strokeWidth={2}
                                        dot={{ fill: '#EF4444', r: 4 }}
                                        name="Systolic"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="diastolic"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3B82F6', r: 4 }}
                                        name="Diastolic"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            )}
                        </div>

                        {/* Weight Chart */}
                        <div className="bg-card-dark border border-sidebar-border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Weight Progress</h2>
                                <button className="text-sm text-primary hover:underline">Last 7 Days</button>
                            </div>
                            {weightData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[250px] text-gray-400">
                                    <Weight className="w-12 h-12 mb-3 text-gray-600" />
                                    <p className="text-sm">No weight data yet</p>
                                    <p className="text-xs text-gray-500 mt-1">Start logging to track progress</p>
                                </div>
                            ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={weightData}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} domain={[75, 77]} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#8B5CF6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                        name="Weight (kg)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Health Summary */}
                    <div className="bg-card-dark border border-sidebar-border rounded-xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Health Summary</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {healthLogs.length > 0
                                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                                        : <AlertCircle className="w-5 h-5 text-gray-400" />}
                                    <span className="font-semibold text-gray-900 dark:text-white">{healthLogs.length} Logs Recorded</span>
                                </div>
                                <p className="text-sm text-gray-400 pl-7">
                                    {healthLogs.length > 0 ? `Last logged: ${logsDesc[0]?.date}` : 'Start logging your health data to see trends'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    <span className="font-semibold text-gray-900 dark:text-white">{healthLogs.length} Days Tracked</span>
                                </div>
                                <p className="text-sm text-gray-400 pl-7">
                                    {healthLogs.length > 0 ? 'Keep up the great work!' : 'Begin your health tracking journey today'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {latestLog ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-gray-400" />}
                                    <span className="font-semibold text-gray-900 dark:text-white">{latestLog ? 'Active Monitoring' : 'Get Started'}</span>
                                </div>
                                <p className="text-sm text-gray-400 pl-7">
                                    {latestLog
                                        ? `SpO2: ${latestLog?.vital_signs?.oxygen_saturation ?? '--'}% · HR: ${latestLog?.vital_signs?.heart_rate ?? '--'} bpm`
                                        : 'Click "Add Log" to record your first health metrics'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ChatLayout>
    );
}
