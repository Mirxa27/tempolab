// Comprehensive Admin Panel with Super Admin Functionality
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Home, 
  Calendar, 
  DollarSign, 
  Settings, 
  BarChart3, 
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  User, 
  Property, 
  Booking, 
  Investment, 
  SystemSetting,
  DashboardStats 
} from '@/types/database';
import AuthService from '@/lib/auth';
import { PropertiesService, BookingsService } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface AdminPageProps {}

const AdminPage: React.FC<AdminPageProps> = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [userFilters, setUserFilters] = useState({ role: '', search: '' });
  
  // Properties management state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyFilters, setPropertyFilters] = useState({ status: '', city: '', search: '' });
  
  // Bookings management state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilters, setBookingFilters] = useState({ status: '', date_from: '', date_to: '' });
  
  // Investments management state
  const [investments, setInvestments] = useState<Investment[]>([]);
  
  // System settings state
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [editingSettings, setEditingSettings] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    initializeAdmin();
  }, []);

  const initializeAdmin = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      if (!AuthService.hasPermission(user, 'access_admin')) {
        navigate('/');
        return;
      }

      setCurrentUser(user);
      await loadDashboardData();
    } catch (err) {
      setError('Failed to initialize admin panel');
      console.error('Admin initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load dashboard statistics
      const [
        { data: properties },
        { data: bookings },
        { data: users },
        { data: investments }
      ] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('users').select('*'),
        supabase.from('investments').select('*')
      ]);

      const stats: DashboardStats = {
        total_properties: properties?.length || 0,
        active_properties: properties?.filter(p => p.status === 'active').length || 0,
        total_bookings: bookings?.length || 0,
        total_revenue: bookings?.filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
        total_users: users?.length || 0,
        total_hosts: users?.filter(u => u.role === 'host').length || 0,
        total_investors: users?.filter(u => u.role === 'investor').length || 0,
        pending_bookings: bookings?.filter(b => b.status === 'pending').length || 0,
        recent_bookings: bookings?.slice(-5) || [],
        recent_reviews: [],
        revenue_chart: []
      };

      setDashboardStats(stats);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const { users: userList } = await AuthService.listUsers(1, 100, userFilters.role as any);
      const filteredUsers = userList.filter(user => 
        !userFilters.search || 
        user.full_name.toLowerCase().includes(userFilters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(userFilters.search.toLowerCase())
      );
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadProperties = async () => {
    try {
      const result = await PropertiesService.searchProperties({
        city: propertyFilters.city || undefined,
        searchTerm: propertyFilters.search || undefined,
        limit: 100
      });
      
      let filteredProperties = result.data;
      if (propertyFilters.status) {
        filteredProperties = filteredProperties.filter(p => p.status === propertyFilters.status);
      }
      
      setProperties(filteredProperties);
    } catch (err) {
      console.error('Error loading properties:', err);
    }
  };

  const loadBookings = async () => {
    try {
      const result = await BookingsService.searchBookings({
        status: bookingFilters.status as any || undefined,
        date_from: bookingFilters.date_from || undefined,
        date_to: bookingFilters.date_to || undefined,
        limit: 100
      });
      setBookings(result.data);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error loading system settings:', err);
    }
  };

  const updateSystemSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value, 
          updated_by: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;
      
      // Refresh settings
      await loadSystemSettings();
      setEditingSettings(prev => ({ ...prev, [key]: undefined }));
    } catch (err) {
      console.error('Error updating system setting:', err);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
    }
  };

  const handlePropertyStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      await PropertiesService.updateProperty(propertyId, { status: newStatus as any });
      await loadProperties();
    } catch (err) {
      console.error('Error updating property status:', err);
    }
  };

  // Load data when tabs change
  useEffect(() => {
    switch (activeTab) {
      case 'users':
        loadUsers();
        break;
      case 'properties':
        loadProperties();
        break;
      case 'bookings':
        loadBookings();
        break;
      case 'settings':
        loadSystemSettings();
        break;
    }
  }, [activeTab, userFilters, propertyFilters, bookingFilters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'investments', label: 'Investments', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Home className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total_properties || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total_bookings || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total_users || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-SA', {
                  style: 'currency',
                  currency: 'SAR',
                }).format(dashboardStats?.total_revenue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {dashboardStats?.recent_bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{booking.property?.title}</p>
                  <p className="text-sm text-gray-600">{booking.guest?.full_name}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Database Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span>API Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Storage Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search users..."
              value={userFilters.search}
              onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={userFilters.role}
              onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="guest">Guest</option>
              <option value="host">Host</option>
              <option value="investor">Investor</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={loadUsers}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {user.profile_image_url ? (
                          <img src={user.profile_image_url} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentUser?.role === 'super_admin' ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="guest">Guest</option>
                        <option value="host">Host</option>
                        <option value="investor">Investor</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <span className="capitalize text-sm">{user.role}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      {currentUser?.role === 'super_admin' && (
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
      
      {currentUser?.role !== 'super_admin' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <Shield className="h-5 w-5 inline mr-2" />
            You need super admin privileges to modify system settings.
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {Object.entries(
          settings.reduce((acc, setting) => {
            if (!acc[setting.category]) acc[setting.category] = [];
            acc[setting.category].push(setting);
            return acc;
          }, {} as { [key: string]: SystemSetting[] })
        ).map(([category, categorySettings]) => (
          <div key={category} className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold capitalize">{category} Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              {categorySettings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{setting.key}</h4>
                    {setting.description && (
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingSettings[setting.key] !== undefined ? (
                      <>
                        <input
                          type="text"
                          value={editingSettings[setting.key]}
                          onChange={(e) => setEditingSettings(prev => ({ 
                            ...prev, 
                            [setting.key]: e.target.value 
                          }))}
                          className="px-3 py-1 border rounded text-sm"
                        />
                        <button
                          onClick={() => updateSystemSetting(setting.key, editingSettings[setting.key])}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSettings(prev => ({ ...prev, [setting.key]: undefined }))}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)}
                        </span>
                        {currentUser?.role === 'super_admin' && (
                          <button
                            onClick={() => setEditingSettings(prev => ({ 
                              ...prev, 
                              [setting.key]: typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)
                            }))}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">HabibStay Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser?.full_name}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {currentUser?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'properties' && (
            <div>Properties management would be implemented here...</div>
          )}
          {activeTab === 'bookings' && (
            <div>Bookings management would be implemented here...</div>
          )}
          {activeTab === 'investments' && (
            <div>Investment management would be implemented here...</div>
          )}
          {activeTab === 'settings' && renderSystemSettings()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;