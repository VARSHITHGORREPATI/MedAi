import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Activity, DollarSign, Calendar, BarChart3, PieChart, ArrowUp, ArrowDown } from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  // Sample analytics data
  const metrics = [
    { 
      label: 'Total Revenue', 
      value: '$45,231', 
      change: '+12.5%', 
      trend: 'up', 
      icon: DollarSign, 
      color: 'green' 
    },
    { 
      label: 'Active Users', 
      value: '1,234', 
      change: '+8.2%', 
      trend: 'up', 
      icon: Users, 
      color: 'blue' 
    },
    { 
      label: 'Consultations', 
      value: '456', 
      change: '+15.3%', 
      trend: 'up', 
      icon: Activity, 
      color: 'purple' 
    },
    { 
      label: 'Lab Tests', 
      value: '789', 
      change: '-3.1%', 
      trend: 'down', 
      icon: BarChart3, 
      color: 'orange' 
    },
  ];

  const getColorClasses = (color) => {
    const classes = {
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    };
    return classes[color] || classes.blue;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Platform performance and insights</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getColorClasses(metric.color)}`}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {metric.change}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
              </div>
            ))}\          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Growth</h3>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Chart visualization placeholder</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Integrate with Chart.js or Recharts</p>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Chart visualization placeholder</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Revenue by day/week/month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Session Duration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12m 34s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bounce Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">23.4%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
