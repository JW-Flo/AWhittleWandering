import React, { useState, useEffect } from 'react';
import { useUnifiedJourneyData } from '../hooks/useUnifiedJourneyData';
import AdminLogin from './AdminLogin';
import { isAdminDomain } from '../utils/adminAccess';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const AdminPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get unified journey data - only what we actually use
  const { 
    isConnected
  } = useUnifiedJourneyData();

  useEffect(() => {
    // Check if we're on admin domain
    if (!isAdminDomain()) {
      window.location.href = 'https://awhittlewandering.com';
      return;
    }
  }, []);

  if (!isAdminDomain()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Redirecting to Public Site...</h1>
          <p>Admin portal is only accessible from admin domain.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onAuthChange={(authenticated) => setIsAuthenticated(authenticated)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Portal</h1>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-green-400 text-lg font-semibold mb-4">
              ✅ A Whittle Wandering - Admin Portal Active
            </div>
            <div className="space-y-2 text-slate-300">
              <p>• API Connection: {isConnected ? 'Operational' : 'Disconnected'}</p>
              <p>• Database: Connected</p>
              <p>• Admin Interface: Available</p>
            </div>
            <div className="mt-6">
              <Button 
                onClick={() => window.open('https://awhittlewandering.com', '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View Public Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPortal;
