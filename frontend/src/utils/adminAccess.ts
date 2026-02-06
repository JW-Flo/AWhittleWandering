// Admin access control utility
// Admin access is now authentication-based, not domain-based

export const getAdminUrl = (path: string = ''): string => {
  // Admin is accessed through the main domain with /admin route
  return `https://awhittlewandering.com/admin${path}`;
};

export const redirectToAdmin = (path: string = ''): void => {
  if (typeof window !== 'undefined') {
    window.location.href = getAdminUrl(path);
  }
};
