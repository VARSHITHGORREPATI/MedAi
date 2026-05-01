import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  Award,
  Shield,
  Clock,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Globe,
  Zap,
  Target,
  Lightbulb
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Heart,
      title: 'Patient-Centric Care',
      description: 'Your health and wellbeing are at the center of everything we do',
      color: 'text-red-600'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Bank-grade encryption for all your medical data and transactions',
      color: 'text-blue-600'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Quick delivery, instant reports, and 24/7 AI-powered assistance',
      color: 'text-yellow-600'
    },
    {
      icon: Users,
      title: 'Expert Network',
      description: 'Access to certified doctors and healthcare professionals',
      color: 'text-green-600'
    },
    {
      icon: Globe,
      title: 'Pan-India Service',
      description: 'Serving customers across major cities and remote locations',
      color: 'text-purple-600'
    },
    {
      icon: Award,
      title: 'Quality Assured',
      description: 'Genuine medicines and certified lab tests with quality guarantee',
      color: 'text-orange-600'
    }
  ];

  const stats = [
    { label: 'Happy Customers', value: '500K+', icon: Users },
    { label: 'Medicines Delivered', value: '2M+', icon: Heart },
    { label: 'Lab Tests Done', value: '100K+', icon: Award },
    { label: 'Cities Covered', value: '50+', icon: Globe }
  ];

  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To make quality healthcare accessible, affordable, and convenient for everyone through innovative technology and compassionate service.'
    },
    {
      icon: Lightbulb,
      title: 'Our Vision',
      description: 'To become India\'s most trusted digital healthcare platform, empowering millions to take control of their health and wellness journey.'
    },
    {
      icon: CheckCircle,
      title: 'Our Promise',
      description: 'Delivering genuine medicines, accurate lab tests, and reliable health information with complete transparency and care.'
    }
  ];

  const timeline = [
    { year: '2020', event: 'MedAI Founded', description: 'Started with a vision to revolutionize healthcare' },
    { year: '2021', event: 'Pharmacy Launch', description: 'Launched online pharmacy with 10,000+ medicines' },
    { year: '2022', event: 'Lab Tests Added', description: 'Expanded to include home sample collection and diagnostics' },
    { year: '2023', event: 'AI Integration', description: 'Introduced AI-powered health assistant and recommendations' },
    { year: '2024', event: 'Pan-India Expansion', description: 'Now serving 50+ cities across India' },
    { year: '2025', event: 'Mobile App', description: 'Launched dedicated mobile applications for iOS and Android' }
  ];

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
              About MedAI
            </h1>
            <p className="text-muted text-lg font-medium leading-relaxed">
              Your trusted healthcare companion
            </p>
          </div>

          {/* Hero Section */}
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-8 md:p-12 mb-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Empowering Health Through Technology
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                MedAI is a comprehensive digital healthcare platform that brings together online pharmacy,
                lab tests, AI-powered health assistance, and expert consultations - all in one place.
                We're on a mission to make healthcare accessible, affordable, and convenient for everyone.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-card-dark rounded-xl p-6 text-center">
                  <IconComponent className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Features */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Why Choose MedAI?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="bg-card-dark rounded-xl p-6 hover:bg-gray-800 transition">
                    <div className={`w-12 h-12 rounded-xl bg-opacity-10 ${feature.color.replace('text-', 'bg-')} flex items-center justify-center mb-4`}>
                      <IconComponent className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mission, Vision, Promise */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6">
                    <IconComponent className="w-10 h-10 text-primary mb-4" />
                    <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Our Journey</h2>
            <div className="bg-card-dark rounded-xl p-6 md:p-8">
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {item.year}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-700 mt-2"></div>
                      )}
                    </div>
                    <div className="pb-6">
                      <h3 className="text-lg font-semibold text-white mb-1">{item.event}</h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">🏥 Online Pharmacy</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>10,000+ genuine medicines and health products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Prescription upload and verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Fast delivery to your doorstep</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-purple-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">🔬 Lab Tests</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Home sample collection at your convenience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>NABL certified labs and accurate results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Digital reports within 24-48 hours</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 border border-green-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">🤖 AI Health Assistant</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>24/7 AI-powered health guidance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Personalized health recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Symptom checker and health insights</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 border border-orange-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">💊 Medicine Reminders</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>Smart medication tracking and reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>Adherence monitoring and reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>Automated refill reminders</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Get in Touch</h2>
            <p className="text-blue-100 mb-6">
              Have questions? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/help')}
                className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Contact Support
              </button>
              <button
                onClick={() => navigate('/chatbot')}
                className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition"
              >
                Chat with AI
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>© 2026 MedAI Healthcare Platform. All rights reserved.</p>
            <p className="mt-2">Working towards a healthier India 🇮🇳</p>
          </div>
        </main>
      </div>
    </ChatLayout>
  );
};

export default About;
