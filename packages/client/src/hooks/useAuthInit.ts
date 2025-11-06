import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setAuthInitialized, setAuthUser } from '@/store/reducers/authSlice';
import { client } from '@/lib/apolloClient';
import { GET_CURRENT_USER } from '@/lib/authQueries';

export const useAuthInit = () => {
  const dispatch = useAppDispatch();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations (e.g., in StrictMode)
    if (hasInitialized.current) {
      return;
    }

    const initAuth = async () => {
      hasInitialized.current = true;

      // Hydrate from cached user immediately if present for instant UI
      const cachedUser = sessionStorage.getItem('auth_user');
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser) as {
            id: string;
            email: string;
          };
          if (parsed?.id && parsed?.email) {
            dispatch(setAuthUser({ id: parsed.id, email: parsed.email }));
          }
        } catch {}
      }

      // Check if we have a token in sessionStorage
      const token = sessionStorage.getItem('access_token');

      if (token) {
        try {
          // Use cache-first to avoid unnecessary network requests on navigation
          // We'll still validate the token, but prefer cached data for speed
          const { data } = await client.query<{
            me: { id: string; email: string; name?: string; username?: string };
          }>({
            query: GET_CURRENT_USER,
            fetchPolicy: 'cache-first', // Prefer cache for faster initialization
          });

          if (data?.me) {
            dispatch(setAuthUser({ id: data.me.id, email: data.me.email }));
          }
        } catch (error) {
          // Token is invalid or expired, clear it
          console.error('Auth initialization failed:', error);
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('auth_user');
        }
      }

      // If there is no token, or after attempting refresh, mark initialized
      dispatch(setAuthInitialized(true));
    };

    initAuth();
  }, [dispatch]);
};
