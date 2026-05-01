import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Scan,
  Package,
  Search,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Pill,
  FileText,
  ShoppingCart
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';

const ScanMedicines = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [scanMode, setScanMode] = useState('barcode'); // barcode or prescription
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setScannedData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scan_type', scanMode);

      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/medicine/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setScannedData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to scan image');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to process the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraClick = () => {
    // In a real app, this would open the device camera
    // For now, we'll trigger file input with camera capture preference
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*,.pdf';
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const searchMedicine = (medicineName) => {
    navigate('/pharmacy', { state: { searchQuery: medicineName } });
  };

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <main className="w-full max-w-4xl mx-auto py-8 px-4 md:px-8">
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
              Scan Your Medicines
            </h1>
            <p className="text-muted text-lg font-medium leading-relaxed">
              Scan barcode or upload prescription to find medicines
            </p>
          </div>

          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => {
                setScanMode('barcode');
                setScannedData(null);
                setError('');
              }}
              className={`p-6 rounded-xl border-2 transition ${
                scanMode === 'barcode'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-card-dark hover:border-gray-600'
              }`}
            >
              <Scan className={`w-8 h-8 mx-auto mb-3 ${scanMode === 'barcode' ? 'text-primary' : 'text-gray-400'}`} />
              <h3 className="text-white font-semibold mb-1">Scan Barcode</h3>
              <p className="text-sm text-gray-400">Scan medicine barcode</p>
            </button>
            <button
              onClick={() => {
                setScanMode('prescription');
                setScannedData(null);
                setError('');
              }}
              className={`p-6 rounded-xl border-2 transition ${
                scanMode === 'prescription'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-card-dark hover:border-gray-600'
              }`}
            >
              <FileText className={`w-8 h-8 mx-auto mb-3 ${scanMode === 'prescription' ? 'text-primary' : 'text-gray-400'}`} />
              <h3 className="text-white font-semibold mb-1">Upload Prescription</h3>
              <p className="text-sm text-gray-400">Extract medicines from Rx</p>
            </button>
          </div>

          {/* Scan Options */}
          <div className="bg-card-dark rounded-xl p-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCameraClick}
                disabled={loading}
                className="p-8 bg-gradient-to-br from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Take Photo</h3>
                <p className="text-sm text-blue-100">
                  Use your camera to {scanMode === 'barcode' ? 'scan barcode' : 'capture prescription'}
                </p>
              </button>
              <button
                onClick={handleUploadClick}
                disabled={loading}
                className="p-8 bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Upload Image</h3>
                <p className="text-sm text-gray-300">
                  Choose image from gallery
                </p>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-card-dark rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">Processing image...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-400 font-semibold mb-1">Scan Failed</h3>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Success State - Scanned Data */}
          {scannedData && (
            <div className="bg-green-900/20 border border-green-700 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-green-400 font-semibold mb-1">Scan Successful!</h3>
                  <p className="text-green-300 text-sm">
                    {scanMode === 'barcode' 
                      ? 'Medicine barcode scanned successfully'
                      : `Found ${scannedData.medicines?.length || 0} medicine(s) in prescription`
                    }
                  </p>
                </div>
              </div>

              {/* Scanned Medicines */}
              <div className="space-y-3 mt-4">
                {scanMode === 'barcode' && scannedData.medicine && (
                  <div className="bg-card-dark rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Pill className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="text-white font-semibold">{scannedData.medicine.name}</h4>
                          <p className="text-sm text-gray-400">{scannedData.medicine.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => searchMedicine(scannedData.medicine.name)}
                        className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Find
                      </button>
                    </div>
                  </div>
                )}

                {scanMode === 'prescription' && scannedData.medicines?.map((medicine, index) => (
                  <div key={index} className="bg-card-dark rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Pill className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="text-white font-semibold">{medicine.name}</h4>
                          {medicine.dosage && (
                            <p className="text-sm text-gray-400">{medicine.dosage}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => searchMedicine(medicine.name)}
                        className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Find
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shop All Button */}
              {scanMode === 'prescription' && scannedData.medicines?.length > 0 && (
                <button
                  onClick={() => navigate('/pharmacy')}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-primary transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Shop All Medicines
                </button>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Instructions</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Ensure good lighting when scanning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Hold your phone steady and align the {scanMode === 'barcode' ? 'barcode' : 'prescription'} within the frame</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>For best results, take a clear, focused photo</span>
              </li>
              {scanMode === 'prescription' && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Make sure all medicine names are visible and legible</span>
                </li>
              )}
            </ul>
          </div>
        </main>
      </div>
    </ChatLayout>
  );
};

export default ScanMedicines;
