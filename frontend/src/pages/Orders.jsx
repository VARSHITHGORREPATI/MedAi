import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  ArrowLeft,
  FileText,
  RefreshCw
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, delivered, cancelled

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/orders/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped':
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status?.toLowerCase() === filter;
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
              My Orders
            </h1>
            <p className="text-muted text-lg font-medium leading-relaxed">
              Track and manage your medicine orders
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-card-dark rounded-xl p-12 text-center">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
              </h3>
              <p className="text-gray-400 mb-6">
                {filter === 'all' 
                  ? 'Start shopping for medicines and health products'
                  : `You don't have any ${filter} orders`}
              </p>
              <button
                onClick={() => navigate('/pharmacy')}
                className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition"
              >
                Browse Pharmacy
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order._id || order.id}
                  className="bg-card-dark rounded-xl p-6 hover:bg-gray-800 transition"
                >
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-gray-700">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Order #{order.order_id || order._id?.slice(-6).toUpperCase()}
                        </h3>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.created_at || order.order_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{order.total_amount || order.amount}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                      <button
                        onClick={() => navigate(`/orders/${order._id || order.id}`)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{item.product_name || item.name}</h4>
                          <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-white font-semibold">
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-sm text-gray-400 text-center">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Delivery Info */}
                  {order.delivery_address && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <h4 className="text-white font-medium mb-1">Delivery Address</h4>
                          <p className="text-sm text-gray-400">
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  {order.phone && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4" />
                      {order.phone}
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
};

export default Orders;
