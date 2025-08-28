import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Home, 
  Calendar, 
  DollarSign, 
  Settings, 
  BarChart3,
  Shield,
  Bell,
  Database,
  Globe,
  Mail,
  CreditCard,
  Brain,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import UserManagement from './components/UserManagement';
import PropertyManagement from './components/PropertyManagement';
import BookingManagement from './components/BookingManagement';
import InvestmentManagement from './components/InvestmentManagement';
import SystemConfiguration from './components/SystemConfiguration';
import Analytics from './components/Analytics';
import AuditLogs from './components/AuditLogs';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0,
    pendingApprovals: 0,
    newUsersToday: 0,
    revenueToday: 0,
  });

  useEffect(() => {
    checkAdminAccess();
    loadDashboardStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const isAdmin = authService.isAdmin();
      if (!isAdmin) {
        navigate('/');
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Load dashboard statistics
      // This would call actual API endpoints
      setStats({
        totalUsers: 1247,
        totalProperties: 342,
        totalBookings: 3891,
        totalRevenue: 1284320,
        activeBookings: 127,
        pendingApprovals: 23,
        newUsersToday: 18,
        revenueToday: 24580,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentUser = authService.getCurrentUser();
  const isSuperAdmin = authService.isSuperAdmin();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {currentUser?.fullName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={isSuperAdmin ? "destructive" : "default"}>
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                Back to Site
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.newUsersToday}</span> today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-yellow-600">{stats.pendingApprovals}</span> pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">{stats.activeBookings}</span> active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalRevenue / 1000).toFixed(1)}k</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+${stats.revenueToday.toLocaleString()}</span> today
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto">
            <TabsTrigger value="overview" className="flex flex-col gap-1 h-auto py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col gap-1 h-auto py-2">
              <Users className="h-4 w-4" />
              <span className="text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex flex-col gap-1 h-auto py-2">
              <Home className="h-4 w-4" />
              <span className="text-xs">Properties</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex flex-col gap-1 h-auto py-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex flex-col gap-1 h-auto py-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Investments</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex flex-col gap-1 h-auto py-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Config</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col gap-1 h-auto py-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex flex-col gap-1 h-auto py-2">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Audit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <PropertyManagement />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="investments" className="space-y-4">
            <InvestmentManagement />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            {isSuperAdmin ? (
              <SystemConfiguration />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Access Restricted</CardTitle>
                  <CardDescription>
                    Only super administrators can access system configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12">
                    <Shield className="h-16 w-16 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Analytics />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </div>

      {/* Real-time Notifications Panel */}
      <div className="fixed bottom-4 right-4 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-semibold text-sm">Live Updates</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              <span className="animate-pulse mr-1">●</span> Live
            </Badge>
          </div>
        </div>
        <ScrollArea className="h-80">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">New booking confirmed</p>
                <p className="text-xs text-gray-500">Villa Paradise - 2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Users className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">New user registered</p>
                <p className="text-xs text-gray-500">John Smith - 5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Home className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Property pending approval</p>
                <p className="text-xs text-gray-500">Sunset Apartment - 8 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <DollarSign className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Payment received</p>
                <p className="text-xs text-gray-500">$2,450 - 12 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium">Booking cancelled</p>
                <p className="text-xs text-gray-500">Ocean View - 15 minutes ago</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AdminDashboard;