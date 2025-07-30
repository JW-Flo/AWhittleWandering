// Admin access control utility
// Only allow admin functions on awhittlewandering.admin.com

export const isAdminDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // Allow admin access on:
  // - awhittlewandering.admin.com
  // - localhost (for development)
  // - 127.0.0.1 (for development)
  return (
    hostname === 'awhittlewandering.admin.com' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1')
  );
};

export const requireAdmin = (): boolean => {
  const isAdmin = isAdminDomain();
  
  if (!isAdmin) {
    console.warn('🚫 Admin access denied - not on admin domain');
    console.warn('Admin functions only available on: awhittlewandering.admin.com');
  }
  
  return isAdmin;
};

export const getAdminUrl = (path: string = ''): string => {
  return `https://awhittlewandering.admin.com${path}`;
};

export const redirectToAdmin = (path: string = ''): void => {
  if (typeof window !== 'undefined') {
    window.location.href = getAdminUrl(path);
  }
};
