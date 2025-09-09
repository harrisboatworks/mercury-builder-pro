import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Settings, BarChart3 } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      });
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-slate-900 font-inter tracking-tight">
              Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-semibold text-slate-900">
                    Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    {user?.email}
                  </CardDescription>
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                    Active Account
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Profile</h3>
                  <p className="text-sm text-slate-600">Manage your account</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Settings className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Settings</h3>
                  <p className="text-sm text-slate-600">Configure preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Analytics</h3>
                  <p className="text-sm text-slate-600">View your data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Getting Started
              </CardTitle>
              <CardDescription>
                Welcome to your dashboard! Here are some things you can do:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">🚀 Quick Setup</h4>
                  <p className="text-sm text-slate-600">
                    Complete your profile and customize your preferences to get the most out of your account.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">📊 Analytics</h4>
                  <p className="text-sm text-slate-600">
                    Track your progress and view detailed insights about your activity and performance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;