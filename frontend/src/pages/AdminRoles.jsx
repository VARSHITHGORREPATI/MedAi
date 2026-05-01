import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Users, Lock } from 'lucide-react';

const ROLES = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full system access with all permissions',
    permissions: ['user_management', 'role_management', 'system_settings', 'analytics', 'all_resources'],
    userCount: 3,
    color: 'red'
  },
  {
    id: 2,
    name: 'Doctor',
    description: 'Medical professionals with patient management access',
    permissions: ['view_patients', 'create_prescriptions', 'view_lab_results', 'consultations', 'appointments'],
    userCount: 45,
    color: 'blue'
  },
  {
    id: 3,
    name: 'Patient',
    description: 'Standard users with access to personal health data',
    permissions: ['view_profile', 'book_appointments', 'view_prescriptions', 'order_medicines', 'health_tracking'],
    userCount: 1234,
    color: 'green'
  },
  {
    id: 4,
    name: 'Pharmacist',
    description: 'Pharmacy staff with medicine management access',
    permissions: ['view_orders', 'manage_inventory', 'process_prescriptions', 'update_prices'],
    userCount: 12,
    color: 'purple'
  },
];

export default function AdminRoles() {
  const [roles, setRoles] = useState(ROLES);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const getColorClasses = (color) => {
    const classes = {
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    };
    return classes[color] || classes.blue;
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(role => role.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Role Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user roles and permissions</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Role
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {/* Role Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${getColorClasses(role.color)}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Users className="w-4 h-4" />
                        {role.userCount} users
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingRole(role);
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(role.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{role.description}</p>

                {/* Permissions */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="w-4 h-4" />
                    Permissions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                      >
                        {perm.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingRole ? 'Edit Role' : 'Add New Role'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role Name</label>
                    <input 
                      type="text"
                      placeholder="Enter role name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea 
                      placeholder="Enter role description"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['user_management', 'view_patients', 'create_prescriptions', 'system_settings'].map((perm) => (
                        <label key={perm} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded text-blue-600" />
                          <span className="text-sm">{perm.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      onClick={() => {
                        setShowModal(false);
                        setEditingRole(null);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      {editingRole ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
