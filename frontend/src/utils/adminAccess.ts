// Admin access control utility
// Admin access is now authentication-based, not domain-based

export const isDevelopment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // Check if we're in development environment
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1')
  );
};

export const getAdminUrl = (path: string = ''): string => {
  // Admin is accessed through the main domain with /admin route
  return `https://awhittlewandering.com/admin${path}`;
};

export const redirectToAdmin = (path: string = ''): void => {
  if (typeof window !== 'undefined') {
    window.location.href = getAdminUrl(path);
  }
};
