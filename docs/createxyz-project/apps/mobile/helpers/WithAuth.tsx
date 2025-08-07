import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function WithAuth(Component: React.ComponentType) {
  return function WrappedComponent(props: any) {
    const { isReady, isAuthenticated, signIn } = useAuth();

    useEffect(() => {
      if (isReady && !isAuthenticated) {
        signIn({ preventBack: true });
      }
    }, [isReady, isAuthenticated]);

    if (!isReady || !isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}