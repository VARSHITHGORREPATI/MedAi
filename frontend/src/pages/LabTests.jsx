import { useState, useEffect, useRef } from 'react';
import { 
  TestTube, Calendar, MapPin, Search, ShoppingCart, Phone, Upload, 
  Package, User, Activity, Heart, Brain, Eye, Bone, Filter, X, Check,
  Clock, FileText, Microscope, Scan, Zap, Shield, Users, Baby, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatLayout from '../components/ChatLayout';

function PrescriptionTestsBanner() {
  const [ap, setAp] = useState(null);
  useEffect(() => {
    try { setAp(JSON.parse(localStorage.getItem('activePrescription') || 'null')); } catch {}
  }, []);
  if (!ap || !ap.lab_tests?.length) return null;
  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 flex flex-wrap items-start gap-3">
      <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold dark:text-white text-gray-900">Prescribed Lab Tests</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {ap.lab_tests.map((t, i) => (
            <span key={i} className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-lg text-xs font-medium">{t}</span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">From: {ap.diagnosis} · Dr. {ap.doctor_name || 'your doctor'}</p>
      </div>
      <Link to="/prescriptions" className="text-xs text-blue-400 hover:underline flex-shrink-0">View Prescription</Link>
    </div>
  );
}

// Test Categories
const TEST_CATEGORIES = [
  { id: 'packages', name: 'Full Body Packages', icon: Package, color: 'blue' },
  { id: 'women', name: 'For Women', icon: Users, color: 'pink' },
  { id: 'men', name: 'For Men', icon: User, color: 'indigo' },
  { id: 'xray_scans', name: 'X-Rays & Scans', icon: Scan, color: 'purple' },
  { id: 'lifestyle', name: 'Lifestyle Checkups', icon: Activity, color: 'green' },
  { id: 'special', name: 'Special Tests', icon: Zap, color: 'yellow' },
];

// Body Systems Filter (consolidated from Health Concerns and Organs)
const BODY_SYSTEMS = [
  { id: 'heart', name: 'Heart', icon: Heart },
  { id: 'liver', name: 'Liver', icon: Activity },
  { id: 'kidney', name: 'Kidney', icon: Activity },
  { id: 'thyroid', name: 'Thyroid', icon: Shield },
  { id: 'lungs', name: 'Lungs', icon: Activity },
  { id: 'brain', name: 'Brain', icon: Brain },
  { id: 'eyes', name: 'Eyes', icon: Eye },
  { id: 'bones', name: 'Bones', icon: Bone },
  { id: 'diabetes', name: 'Diabetes', icon: Activity },
];

export default function LabTests() {
  const [tests, setTests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showReportUpload, setShowReportUpload] = useState(false);
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
    notes: ''
  });
  const reportInputRef = useRef(null);
  const prescriptionInputRef = useRef(null);

  useEffect(() => {
    fetchTests();
    fetchBookings();
  }, [selectedCategory, search]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (search) params.append('search', search);
      
      const response = await fetch(`http://localhost:8000/api/lab-tests/tests?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTests(data.data);
      } else {
        setError(data.detail || data.message || 'Failed to fetch lab tests');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('http://localhost:8000/api/lab-tests/bookings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.success) setBookings(data.data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setBookings([]);
      }
    }
  };

  const addToCart = (test) => {
    if (!cart.find(t => t._id === test._id)) {
      setCart([...cart, test]);
    }
  };

  const removeFromCart = (testId) => {
    setCart(cart.filter(t => t._id !== testId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, test) => sum + test.price, 0);
  };

  const handleReportUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReportFile(file);
    }
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescriptionFile(file);
    }
  };

  const uploadLabReport = async () => {
    if (!reportFile) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('title', 'Lab Report');
      
      const response = await fetch('http://localhost:8000/api/lab-tests/upload-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Lab report uploaded successfully!');
        setShowReportUpload(false);
        setReportFile(null);
      } else {
        alert('Failed to upload report: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading report: ' + error.message);
    }
  };

  const bookTests = async () => {
    if (cart.length === 0) {
      alert('Please add tests to cart');
      return;
    }
    
    if (!bookingForm.scheduled_date || !bookingForm.address || !bookingForm.phone) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      
      const bookingData = {
        test_ids: cart.map(t => t._id),
        test_names: cart.map(t => t.name),
        total_price: getTotalAmount(),
        scheduled_date: bookingForm.scheduled_date,
        scheduled_time: bookingForm.scheduled_time || '09:00',
        address: bookingForm.address,
        city: bookingForm.city,
        pincode: bookingForm.pincode,
        phone: bookingForm.phone,
        notes: bookingForm.notes,
        status: 'pending'
      };
      
      const response = await fetch('http://localhost:8000/api/lab-tests/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Upload prescription if available
        if (prescriptionFile && data.booking_id) {
          const formData = new FormData();
          formData.append('booking_id', data.booking_id);
          formData.append('file', prescriptionFile);
          
          await fetch('http://localhost:8000/api/lab-tests/upload-prescription', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }
        
        alert(`Booking confirmed! Booking ID: ${data.booking_id}`);
        setCart([]);
        setShowBookingForm(false);
        setShowCart(false);
        setPrescriptionFile(null);
        setBookingForm({
          scheduled_date: '',
          scheduled_time: '',
          address: '',
          city: '',
          pincode: '',
          phone: '',
          notes: ''
        });
        fetchBookings();
      } else {
        alert('Failed to book tests: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error booking tests: ' + error.message);
    }
  };

  const filteredTests = tests.filter(test => {
    if (selectedSystem && test.health_concern !== selectedSystem && test.organ !== selectedSystem) return false;
    return true;
  });

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PrescriptionTestsBanner />
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Lab Tests & Diagnostics</h1>
              <p className="text-muted">Book tests, upload reports, track your health</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowReportUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">Upload Report</span>
              </button>
              <a 
                href="tel:+911234567890"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="hidden sm:inline">Book via Call</span>
              </a>
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Search for tests, packages, health checkups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-sidebar border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-primary" />
              Test Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-sidebar-border bg-sidebar hover:border-primary/50'
                }`}
              >
                <Filter className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-white font-medium text-sm">All Tests</p>
              </button>
              {TEST_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCategory === cat.id
                        ? 'border-primary bg-primary/10'
                        : 'border-sidebar-border bg-sidebar hover:border-primary/50'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 text-${cat.color}-500`} />
                    <p className="text-white font-medium text-sm">{cat.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Systems Filter */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Filter by Body System
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedSystem(null)}
                className={`px-4 py-2 rounded-full transition-all ${
                  selectedSystem === null
                    ? 'bg-primary text-white'
                    : 'bg-sidebar border border-sidebar-border text-muted hover:border-primary'
                }`}
              >
                All
              </button>
              {BODY_SYSTEMS.map(system => {
                const Icon = system.icon;
                return (
                  <button
                    key={system.id}
                    onClick={() => setSelectedSystem(system.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      selectedSystem === system.id
                        ? 'bg-primary text-white'
                        : 'bg-sidebar border border-sidebar-border text-muted hover:border-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {system.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tests */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted">Loading tests...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={fetchTests}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 mx-auto mb-4 text-muted" />
              <p className="text-muted text-lg">
                {search || selectedSystem ? 'No tests match your filters.' : 'No tests available.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted">{filteredTests.length} tests found</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map(test => (
                  <div key={test._id} className="bg-sidebar rounded-lg border border-sidebar-border p-5 hover:border-primary transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TestTube className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1 line-clamp-2">{test.name}</h3>
                        {test.test_count && (
                          <p className="text-muted text-xs">{test.test_count} tests included</p>
                        )}
                      </div>
                    </div>
                    
                    {test.description && (
                      <p className="text-muted text-sm mb-4 line-clamp-3">{test.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                      {test.fasting_required && (
                        <span className="px-2 py-1 bg-orange-900/20 border border-orange-800 rounded text-orange-400 text-xs">
                          Fasting Required
                        </span>
                      )}
                      {test.home_collection && (
                        <span className="px-2 py-1 bg-green-900/20 border border-green-800 rounded text-green-400 text-xs">
                          Home Collection
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {test.original_price && (
                          <span className="text-muted text-sm line-through block">₹{test.original_price}</span>
                        )}
                        <span className="text-2xl font-bold text-primary">₹{test.price}</span>
                      </div>
                      <button
                        onClick={() => addToCart(test)}
                        disabled={cart.find(t => t._id === test._id)}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {cart.find(t => t._id === test._id) ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Bookings */}
          {bookings.length > 0 && (
            <div className="mt-12 bg-sidebar rounded-lg border border-sidebar-border p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                My Bookings
              </h2>
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking._id} className="bg-sidebar-hover rounded-lg p-4 border border-sidebar-border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold dark:text-white text-gray-900">
                          {booking.test_names?.join(', ') || 'Lab Tests'}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.scheduled_date).toLocaleDateString()}
                          </span>
                          {booking.scheduled_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {booking.scheduled_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400' :
                        booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400' :
                        booking.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400' :
                        'bg-sidebar border border-sidebar-border text-muted'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary">₹{booking.total_price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowCart(false)}>
            <div 
              className="w-full max-w-md bg-sidebar h-full overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Test Cart ({cart.length})
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-sidebar-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <ShoppingCart className="w-16 h-16 text-muted mb-4" />
                  <p className="text-white font-semibold mb-2">Your cart is empty</p>
                  <p className="text-muted text-sm text-center">Add tests to your cart to book them</p>
                </div>
              ) : (
                <>
                  <div className="p-6 space-y-4">
                    {cart.map(test => (
                      <div key={test._id} className="bg-sidebar-hover rounded-lg p-4 border border-sidebar-border">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded bg-primary/10 flex-shrink-0 flex items-center justify-center">
                            <TestTube className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium mb-1 line-clamp-2">{test.name}</h4>
                            {test.test_count && (
                              <p className="text-muted text-xs mb-2">{test.test_count} tests</p>
                            )}
                            <span className="text-primary font-bold">₹{test.price}</span>
                          </div>
                          <button
                            onClick={() => removeFromCart(test._id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {cart.some(t => t.requires_prescription) && !prescriptionFile && (
                      <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
                        <p className="text-orange-400 text-sm font-medium mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Prescription Required for some tests
                        </p>
                        <button
                          onClick={() => setShowPrescriptionUpload(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Prescription
                        </button>
                      </div>
                    )}

                    {prescriptionFile && (
                      <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                        <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Prescription uploaded: {prescriptionFile.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-sidebar-border bg-sidebar-hover">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-white font-bold text-lg">
                        <span>Total Amount</span>
                        <span className="text-primary">₹{getTotalAmount()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowBookingForm(true);
                      }}
                      className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Proceed to Book
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Prescription Upload Modal */}
        {showPrescriptionUpload && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-sidebar rounded-lg border border-sidebar-border max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold dark:text-white text-gray-900">Upload Prescription</h3>
                <button
                  onClick={() => setShowPrescriptionUpload(false)}
                  className="p-2 hover:bg-sidebar-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-muted text-sm mb-4">
                  Upload a valid prescription from a registered medical practitioner.
                </p>
                
                <input
                  ref={prescriptionInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePrescriptionUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => prescriptionInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-sidebar-border rounded-lg p-8 hover:border-primary transition-colors flex flex-col items-center gap-3"
                >
                  <Upload className="w-12 h-12 text-primary" />
                  <div>
                    <p className="text-white font-medium">Click to upload prescription</p>
                    <p className="text-muted text-sm">Supports JPG, PNG, PDF (Max 5MB)</p>
                  </div>
                </button>

                {prescriptionFile && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {prescriptionFile.name}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowPrescriptionUpload(false)}
                disabled={!prescriptionFile}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Report Upload Modal */}
        {showReportUpload && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-sidebar rounded-lg border border-sidebar-border max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold dark:text-white text-gray-900">Upload Lab Report</h3>
                <button
                  onClick={() => setShowReportUpload(false)}
                  className="p-2 hover:bg-sidebar-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-muted text-sm mb-4">
                  Upload your lab test reports to keep track of your health records.
                </p>
                
                <input
                  ref={reportInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReportUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => reportInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-sidebar-border rounded-lg p-8 hover:border-primary transition-colors flex flex-col items-center gap-3"
                >
                  <FileText className="w-12 h-12 text-primary" />
                  <div>
                    <p className="text-white font-medium">Click to upload report</p>
                    <p className="text-muted text-sm">Supports JPG, PNG, PDF (Max 10MB)</p>
                  </div>
                </button>

                {reportFile && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {reportFile.name}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={uploadLabReport}
                disabled={!reportFile}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Report
              </button>
            </div>
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-sidebar rounded-lg border border-sidebar-border max-w-2xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold dark:text-white text-gray-900">Book Lab Tests</h3>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="p-2 hover:bg-sidebar-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Selected Tests */}
                <div className="bg-sidebar-hover rounded-lg p-4 border border-sidebar-border">
                  <h4 className="text-white font-semibold mb-3">Selected Tests</h4>
                  <div className="space-y-2">
                    {cart.map(test => (
                      <div key={test._id} className="flex justify-between text-sm">
                        <span className="text-muted">{test.name}</span>
                        <span className="text-white">₹{test.price}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-sidebar-border flex justify-between font-bold">
                      <span className="text-white">Total Amount</span>
                      <span className="text-primary text-lg">₹{getTotalAmount()}</span>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Appointment Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={bookingForm.scheduled_date}
                      onChange={(e) => setBookingForm({...bookingForm, scheduled_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="time"
                      value={bookingForm.scheduled_time}
                      onChange={(e) => setBookingForm({...bookingForm, scheduled_time: e.target.value})}
                      className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Collection Address</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Address"
                      value={bookingForm.address}
                      onChange={(e) => setBookingForm({...bookingForm, address: e.target.value})}
                      className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={bookingForm.city}
                        onChange={(e) => setBookingForm({...bookingForm, city: e.target.value})}
                        className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={bookingForm.pincode}
                        onChange={(e) => setBookingForm({...bookingForm, pincode: e.target.value})}
                        className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      placeholder="Additional Notes (Optional)"
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={bookTests}
                  disabled={!bookingForm.scheduled_date || !bookingForm.address || !bookingForm.phone}
                  className="w-full bg-primary text-white py-4 rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Booking - ₹{getTotalAmount()}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ChatLayout>
  );
}
