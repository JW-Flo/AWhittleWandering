import React from 'react';
import PublicApp from '@/components/PublicApp';
import AdminPortal from '@/components/AdminPortal';
import { isAdminDomain } from '@/utils/adminAccess';

const Index = () => {
  // Route to admin portal if on admin domain, otherwise show public app
  if (isAdminDomain()) {
    return <AdminPortal />;
  }
  
  return <PublicApp />;
};

export default Index;
