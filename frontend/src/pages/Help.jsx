import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Headphones,
  FileQuestion,
  Shield,
  CreditCard
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';

const Help = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      category: 'Orders',
      question: 'How do I track my order?',
      answer: 'You can track your order by going to My Orders section from your profile. Each order shows real-time status updates including order confirmation, processing, shipped, and delivered.'
    },
    {
      id: 2,
      category: 'Orders',
      question: 'Can I cancel or modify my order?',
      answer: 'Yes, you can cancel your order before it is shipped. Go to My Orders, find your order, and click on Cancel Order button. Once shipped, cancellation is not possible but you can request a return.'
    },
    {
      id: 3,
      category: 'Payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets. All payments are secure and encrypted.'
    },
    {
      id: 4,
      category: 'Prescriptions',
      question: 'Do I need a prescription for all medicines?',
      answer: 'Prescription medicines require a valid prescription from a registered medical practitioner. OTC (Over-the-counter) medicines can be ordered without a prescription.'
    },
    {
      id: 5,
      category: 'Prescriptions',
      question: 'How do I upload my prescription?',
      answer: 'You can upload your prescription during checkout or use the Scan Your Medicines feature to extract medicines directly from your prescription image.'
    },
    {
      id: 6,
      category: 'Delivery',
      question: 'What is the delivery time?',
      answer: 'Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available for select locations. Delivery time may vary based on your location and product availability.'
    },
    {
      id: 7,
      category: 'Lab Tests',
      question: 'How do I book a lab test?',
      answer: 'Visit the Lab Tests section, browse available tests, add to cart, and book with your preferred date and time. Our phlebotomist will visit your home for sample collection.'
    },
    {
      id: 8,
      category: 'Lab Tests',
      question: 'When will I receive my lab reports?',
      answer: 'Most lab reports are available within 24-48 hours of sample collection. Some specialized tests may take longer. You will be notified via SMS and email when reports are ready.'
    },
    {
      id: 9,
      category: 'Account',
      question: 'How do I reset my password?',
      answer: 'Click on Forgot Password on the login page, enter your registered email, and follow the instructions sent to your email to reset your password.'
    },
    {
      id: 10,
      category: 'General',
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your personal and medical data. We comply with all healthcare data privacy regulations.'
    }
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: 'Call Us',
      details: '1800-123-4567',
      subtext: 'Mon-Sat: 9AM - 9PM',
      action: () => window.location.href = 'tel:18001234567',
      color: 'text-green-600'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: 'support@medai.com',
      subtext: 'Response within 24 hours',
      action: () => window.location.href = 'mailto:support@medai.com',
      color: 'text-blue-600'
    },
    {
      icon: MessageSquare,
      title: 'Chat Support',
      details: 'AI Chatbot',
      subtext: 'Available 24/7',
      action: () => navigate('/chatbot'),
      color: 'text-purple-600'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: 'MedAI Headquarters',
      subtext: 'Bangalore, Karnataka',
      action: () => {},
      color: 'text-red-600'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(faqs.map(faq => faq.category))];

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
              Need Help?
            </h1>
            <p className="text-muted text-lg font-medium leading-relaxed">
              FAQs, support & contact information
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <button
                  key={index}
                  onClick={method.action}
                  className="bg-card-dark rounded-xl p-6 hover:bg-gray-800 transition text-left"
                >
                  <IconComponent className={`w-8 h-8 ${method.color} mb-3`} />
                  <h3 className="text-white font-semibold mb-1">{method.title}</h3>
                  <p className="text-gray-300 text-sm mb-1">{method.details}</p>
                  <p className="text-gray-500 text-xs">{method.subtext}</p>
                </button>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => navigate('/orders')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 hover:from-blue-700 hover:to-blue-800 transition"
            >
              <FileQuestion className="w-6 h-6 text-white mb-2" />
              <p className="text-white font-medium text-sm">Order Issues</p>
            </button>
            <button
              onClick={() => navigate('/pharmacy')}
              className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 hover:from-purple-700 hover:to-purple-800 transition"
            >
              <CreditCard className="w-6 h-6 text-white mb-2" />
              <p className="text-white font-medium text-sm">Payment Help</p>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 hover:from-green-700 hover:to-green-800 transition"
            >
              <Shield className="w-6 h-6 text-white mb-2" />
              <p className="text-white font-medium text-sm">Account</p>
            </button>
            <button
              onClick={() => navigate('/chatbot')}
              className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 hover:from-orange-700 hover:to-orange-800 transition"
            >
              <Headphones className="w-6 h-6 text-white mb-2" />
              <p className="text-white font-medium text-sm">Live Support</p>
            </button>
          </div>

          {/* FAQ Section */}
          <div className="bg-card-dark rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSearchQuery('')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  searchQuery === ''
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSearchQuery(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    searchQuery === category
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-gray-800/50 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition"
                  >
                    <div className="flex items-start gap-3 text-left flex-1">
                      <span className="text-xs font-semibold text-primary bg-primary/20 px-2 py-1 rounded mt-1">
                        {faq.category}
                      </span>
                      <span className="text-white font-medium">{faq.question}</span>
                    </div>
                    {expandedFaq === faq.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-gray-400 text-sm leading-relaxed ml-20">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No FAQs found matching your search</p>
              </div>
            )}
          </div>

          {/* Support Hours */}
          <div className="mt-6 bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">Support Hours</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Monday - Saturday: 9:00 AM - 9:00 PM IST</p>
                  <p>Sunday: 10:00 AM - 6:00 PM IST</p>
                  <p className="text-primary mt-2">AI Chatbot available 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ChatLayout>
  );
};

export default Help;
