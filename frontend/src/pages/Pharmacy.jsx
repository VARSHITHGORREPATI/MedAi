import { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, X, Phone, Upload, Package, 
  Pill, Heart, Activity, Leaf, Thermometer, Stethoscope, 
  Shield, Baby, Eye, Bone, Brain, Filter, ChevronDown, Check
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Health Categories
const HEALTH_CATEGORIES = [
  { id: 'medicines', name: 'Medicines', icon: Pill, color: 'blue' },
  { id: 'vitamins', name: 'Vitamins & Supplements', icon: Leaf, color: 'green' },
  { id: 'medical_devices', name: 'Medical Devices', icon: Stethoscope, color: 'purple' },
  { id: 'diet_nutrition', name: 'Diet & Nutrition', icon: Heart, color: 'red' },
  { id: 'fitness', name: 'Fitness & Wellness', icon: Activity, color: 'orange' },
  { id: 'personal_care', name: 'Personal Care', icon: Shield, color: 'pink' },
  { id: 'baby_care', name: 'Baby Care', icon: Baby, color: 'cyan' },
  { id: 'ayurveda', name: 'Ayurveda & Herbs', icon: Leaf, color: 'emerald' },
];

// Health Concerns
const HEALTH_CONCERNS = [
  { id: 'diabetes', name: 'Diabetes Care', icon: Thermometer },
  { id: 'heart', name: 'Heart Health', icon: Heart },
  { id: 'immunity', name: 'Immunity Boosters', icon: Shield },
  { id: 'bone', name: 'Bone & Joint', icon: Bone },
  { id: 'mental', name: 'Mental Wellness', icon: Brain },
  { id: 'eye', name: 'Eye Care', icon: Eye },
];

export default function Pharmacy() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    address: '',
    city: '',
    pincode: '',
    phone: '',
    paymentMethod: 'cod'
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (search) params.append('search', search);
      
      // Add timeout for faster empty state
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${API_BASE_URL}/api/products?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setProducts(data.data);
      } else {
        setError(data.detail || data.message || 'Failed to fetch products');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Timeout - show empty state
        setProducts([]);
        setError(null);
      } else {
        setError(`Network error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => 
        item._id === product._id ? {...item, quantity: item.quantity + 1} : item
      ));
    } else {
      setCart([...cart, {...product, quantity: 1}]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item._id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? {...item, quantity: newQuantity} : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const requiresPrescription = () => {
    return cart.some(item => item.requires_prescription);
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescriptionFile(file);
    }
  };

  const handleCheckout = async () => {
    if (requiresPrescription() && !prescriptionFile) {
      setShowPrescriptionUpload(true);
      return;
    }
    
    setShowCheckout(true);
  };

  const placeOrder = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const orderData = {
        items: cart.map(item => ({
          product_id: item._id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: getTotalAmount(),
        shipping_address: {
          address: checkoutForm.address,
          city: checkoutForm.city,
          pincode: checkoutForm.pincode,
          phone: checkoutForm.phone
        },
        payment_method: checkoutForm.paymentMethod,
        requires_prescription: requiresPrescription()
      };
      
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Upload prescription if available
        if (prescriptionFile && data.order_id) {
          const formData = new FormData();
          formData.append('order_id', data.order_id);
          formData.append('file', prescriptionFile);
          
          await fetch(`${API_BASE_URL}/api/orders/upload-prescription`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }
        
        alert(`Order placed successfully! Order Number: ${data.order_number}`);
        setCart([]);
        setShowCheckout(false);
        setShowCart(false);
        setPrescriptionFile(null);
      } else {
        alert('Failed to place order: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Error placing order: ' + error.message);
    }
  };

  const filteredProducts = selectedConcern
    ? products.filter(p => p.health_concern === selectedConcern)
    : products;

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">MedAI Pharmacy</h1>
              <p className="text-muted">Order medicines, supplements & health products</p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="tel:+911234567890"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="hidden sm:inline">Call to Order</span>
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
                placeholder="Search for medicines, supplements, health products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-sidebar border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-sidebar-border bg-sidebar hover:border-primary/50'
                }`}
              >
                <Filter className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-white font-medium text-sm">All Products</p>
              </button>
              {HEALTH_CATEGORIES.map(cat => {
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

          {/* Health Concerns */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Shop by Health Concerns
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedConcern(null)}
                className={`px-4 py-2 rounded-full transition-all ${
                  selectedConcern === null
                    ? 'bg-primary text-white'
                    : 'bg-sidebar border border-sidebar-border text-muted hover:border-primary'
                }`}
              >
                All
              </button>
              {HEALTH_CONCERNS.map(concern => {
                const Icon = concern.icon;
                return (
                  <button
                    key={concern.id}
                    onClick={() => setSelectedConcern(concern.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      selectedConcern === concern.id
                        ? 'bg-primary text-white'
                        : 'bg-sidebar border border-sidebar-border text-muted hover:border-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {concern.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted">Loading products...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={fetchProducts}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted" />
              <p className="text-muted text-lg">
                {search || selectedConcern ? 'No products match your search.' : 'No products available.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted">{filteredProducts.length} products found</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product._id} className="bg-sidebar rounded-lg border border-sidebar-border p-5 hover:border-primary transition-all">
                    <div className="mb-4">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded" />
                      ) : (
                        <div className="w-full h-40 bg-sidebar-hover rounded flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted" />
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="text-white font-semibold mb-1 line-clamp-2">{product.name}</h3>
                      {product.manufacturer && (
                        <p className="text-muted text-xs">{product.manufacturer}</p>
                      )}
                    </div>
                    
                    {product.description && (
                      <p className="text-muted text-sm mb-3 line-clamp-2">{product.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      {product.original_price && (
                        <span className="text-muted text-sm line-through">₹{product.original_price}</span>
                      )}
                      <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                    </div>
                    
                    {product.requires_prescription && (
                      <div className="mb-3 px-2 py-1 bg-orange-900/20 border border-orange-800 rounded text-orange-400 text-xs inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Prescription Required
                      </div>
                    )}
                    
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
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
                  Shopping Cart ({cart.length})
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
                  <p className="text-muted text-sm text-center">Add products to your cart to see them here</p>
                </div>
              ) : (
                <>
                  <div className="p-6 space-y-4">
                    {cart.map(item => (
                      <div key={item._id} className="bg-sidebar-hover rounded-lg p-4 border border-sidebar-border">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-sidebar rounded flex-shrink-0 flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium mb-1 line-clamp-2">{item.name}</h4>
                            {item.manufacturer && (
                              <p className="text-muted text-xs mb-2">{item.manufacturer}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-primary font-bold">₹{item.price}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item._id, -1)}
                                  className="w-8 h-8 rounded bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors"
                                >
                                  <Minus className="w-4 h-4 text-white" />
                                </button>
                                <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item._id, 1)}
                                  className="w-8 h-8 rounded bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors"
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                            {item.requires_prescription && (
                              <div className="mt-2 px-2 py-1 bg-orange-900/20 border border-orange-800 rounded text-orange-400 text-xs inline-flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Prescription Required
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {requiresPrescription() && !prescriptionFile && (
                      <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
                        <p className="text-orange-400 text-sm font-medium mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Prescription Required
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
                      <div className="flex justify-between text-muted">
                        <span>Subtotal</span>
                        <span>₹{getTotalAmount()}</span>
                      </div>
                      <div className="flex justify-between text-muted">
                        <span>Delivery</span>
                        <span className="text-green-500">FREE</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-sidebar-border">
                        <span>Total</span>
                        <span className="text-primary">₹{getTotalAmount()}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Proceed to Checkout
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
                  Please upload a valid prescription from a registered medical practitioner.
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePrescriptionUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
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

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-sidebar rounded-lg border border-sidebar-border max-w-2xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold dark:text-white text-gray-900">Checkout</h3>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 hover:bg-sidebar-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Delivery Address */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Delivery Address</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Address"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                      className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                        className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={checkoutForm.pincode}
                        onChange={(e) => setCheckoutForm({...checkoutForm, pincode: e.target.value})}
                        className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-sidebar-hover border border-sidebar-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Payment Method</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-4 bg-sidebar-hover border border-sidebar-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={checkoutForm.paymentMethod === 'cod'}
                        onChange={(e) => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value})}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-white">Cash on Delivery</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-sidebar-hover border border-sidebar-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={checkoutForm.paymentMethod === 'online'}
                        onChange={(e) => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value})}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-white">Online Payment (UPI/Card)</span>
                    </label>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-sidebar-hover rounded-lg p-4 border border-sidebar-border">
                  <h4 className="text-white font-semibold mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-muted">{item.name} x {item.quantity}</span>
                        <span className="text-white">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-sidebar-border flex justify-between font-bold">
                      <span className="text-white">Total Amount</span>
                      <span className="text-primary text-lg">₹{getTotalAmount()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={!checkoutForm.address || !checkoutForm.city || !checkoutForm.pincode || !checkoutForm.phone}
                  className="w-full bg-primary text-white py-4 rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Place Order - ₹{getTotalAmount()}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ChatLayout>
  );
}
